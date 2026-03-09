package services

import (
	"fmt"
	"log"
	"time"

	"github.com/robfig/cron/v3"
	"github.com/thanunbenz/su-booking-room/internal/models"
	"gorm.io/gorm"
)

// ReminderService - Service สำหรับส่ง reminder notifications
type ReminderService struct {
	DB           *gorm.DB
	NotifService *NotificationService
	Cron         *cron.Cron
	HoursBefore  int
	Enabled      bool
}

// NewReminderService - สร้าง ReminderService instance
func NewReminderService(db *gorm.DB, notifService *NotificationService, hoursBefore int, enabled bool) *ReminderService {
	return &ReminderService{
		DB:           db,
		NotifService: notifService,
		Cron:         cron.New(),
		HoursBefore:  hoursBefore,
		Enabled:      enabled,
	}
}

// Start - เริ่ม cron job
func (s *ReminderService) Start() {
	if !s.Enabled {
		log.Println("⏰ Reminder service is DISABLED")
		return
	}

	// Schedule: ทุก 1 ชั่วโมง (0 * * * *)
	// หรือใช้ @hourly
	_, err := s.Cron.AddFunc("@hourly", s.CheckUpcomingBookings)
	if err != nil {
		log.Printf("❌ Failed to schedule reminder job: %v\n", err)
		return
	}

	s.Cron.Start()
	log.Printf("✅ Reminder service started (checking every hour for bookings %d hours ahead)\n", s.HoursBefore)
}

// Stop - หยุด cron job
func (s *ReminderService) Stop() {
	if !s.Enabled {
		return
	}

	log.Println("🛑 Stopping reminder service...")
	ctx := s.Cron.Stop()
	<-ctx.Done()
	log.Println("✅ Reminder service stopped")
}

// CheckUpcomingBookings - ตรวจสอบการจองที่จะเกิดขึ้นในอีก X ชั่วโมง
func (s *ReminderService) CheckUpcomingBookings() {
	if !s.Enabled {
		return
	}

	log.Println("🔍 Checking for upcoming bookings...")

	now := time.Now()
	reminderTime := now.Add(time.Duration(s.HoursBefore) * time.Hour)

	// คำนวณเวลาเริ่มต้นและสิ้นสุดของ time window (ในช่วง 1 ชม. ถัดไป)
	windowStart := reminderTime
	windowEnd := reminderTime.Add(1 * time.Hour)

	log.Printf("📅 Looking for bookings between %s and %s\n",
		windowStart.Format("2006-01-02 15:04"),
		windowEnd.Format("2006-01-02 15:04"))

	var bookings []models.Booking

	// Query bookings ที่:
	// 1. Status = approved
	// 2. booking_date + start_time อยู่ในช่วง windowStart ถึง windowEnd
	// 3. ยังไม่ได้ส่ง reminder (ตรวจสอบจาก notifications table)
	err := s.DB.
		Preload("User").
		Preload("Room.Building").
		Where("status = ?", "approved").
		Where("booking_date = ?", reminderTime.Format("2006-01-02")).
		Find(&bookings).Error

	if err != nil {
		log.Printf("❌ Failed to query bookings: %v\n", err)
		return
	}

	if len(bookings) == 0 {
		log.Println("✅ No upcoming bookings found")
		return
	}

	log.Printf("📋 Found %d approved bookings on %s\n", len(bookings), reminderTime.Format("2006-01-02"))

	// ส่ง reminder สำหรับแต่ละ booking
	sentCount := 0
	for _, booking := range bookings {
		// Parse start time
		startTimeParts := parseTime(booking.StartTime)
		if startTimeParts == nil {
			continue
		}

		// สร้าง datetime ของการจอง
		bookingDateTime := time.Date(
			booking.BookingDate.Time.Year(),
			booking.BookingDate.Time.Month(),
			booking.BookingDate.Time.Day(),
			startTimeParts[0], // hour
			startTimeParts[1], // minute
			0, 0,
			now.Location(),
		)

		// ตรวจสอบว่าอยู่ใน window หรือไม่
		if bookingDateTime.After(windowStart) && bookingDateTime.Before(windowEnd) {
			// ตรวจสอบว่าเคยส่ง reminder แล้วหรือยัง
			if s.hasReminderBeenSent(booking.BookingID) {
				log.Printf("⏭️  Skip booking #%d (reminder already sent)\n", booking.BookingID)
				continue
			}

			// ส่ง reminder
			log.Printf("📧 Sending reminder for booking #%d (User: %s, Room: %s, Time: %s)\n",
				booking.BookingID,
				booking.User.Email,
				booking.Room.Name,
				booking.StartTime)

			if err := s.NotifService.NotifyBookingReminder(booking.BookingID); err != nil {
				log.Printf("❌ Failed to send reminder for booking #%d: %v\n", booking.BookingID, err)
			} else {
				sentCount++
			}
		}
	}

	log.Printf("✅ Sent %d reminder(s)\n", sentCount)
}

// hasReminderBeenSent - ตรวจสอบว่าเคยส่ง reminder แล้วหรือยัง
func (s *ReminderService) hasReminderBeenSent(bookingID int) bool {
	var count int64
	s.DB.Model(&models.Notification{}).
		Where("booking_id = ? AND type = ?", bookingID, "booking_reminder").
		Count(&count)
	return count > 0
}

// parseTime - แปลง time string (HH:MM) เป็น [hour, minute]
func parseTime(timeStr string) []int {
	var hour, minute int
	_, err := time.Parse("15:04", timeStr)
	if err != nil {
		log.Printf("⚠️  Invalid time format: %s\n", timeStr)
		return nil
	}

	// Parse HH:MM
	if _, err := fmt.Sscanf(timeStr, "%d:%d", &hour, &minute); err != nil {
		return nil
	}

	return []int{hour, minute}
}
