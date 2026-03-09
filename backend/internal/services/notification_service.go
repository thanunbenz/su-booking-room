package services

import (
	"fmt"
	"log"
	"time"

	"github.com/thanunbenz/su-booking-room/internal/models"
	"gorm.io/gorm"
)

// NotificationService - Service สำหรับจัดการ notifications
type NotificationService struct {
	DB           *gorm.DB
	EmailService *EmailService
	BaseURL      string // Base URL สำหรับ links ใน email
}

// NewNotificationService - สร้าง NotificationService instance
func NewNotificationService(db *gorm.DB, emailService *EmailService, baseURL string) *NotificationService {
	return &NotificationService{
		DB:           db,
		EmailService: emailService,
		BaseURL:      baseURL,
	}
}

// NotifyBookingCreated - แจ้งเตือนเมื่อสร้างการจองใหม่
func (s *NotificationService) NotifyBookingCreated(bookingID int) error {
	booking, err := s.getBookingDetails(bookingID)
	if err != nil {
		return fmt.Errorf("failed to get booking details: %w", err)
	}

	// สร้าง notification message
	message := fmt.Sprintf("การจองห้อง %s ในวันที่ %s เวลา %s-%s ได้รับการบันทึกเรียบร้อยแล้ว",
		booking.Room.Name,
		booking.BookingDate.Time.Format("02/01/2006"),
		booking.StartTime,
		booking.EndTime,
	)

	// เพิ่มข้อความเกี่ยวกับสถานะ
	if booking.Status == "pending" {
		message += " (รอการอนุมัติ)"
	} else if booking.Status == "approved" {
		message += " (อนุมัติแล้ว)"
	}

	// สร้าง notification record
	notificationID, err := s.createNotification(booking.UserID, bookingID, "booking_created", message)
	if err != nil {
		return err
	}

	// ส่งอีเมล
	go s.sendBookingEmail(notificationID, booking, "booking_created.html", "การจองห้องสำเร็จ")

	return nil
}

// NotifyBookingApproved - แจ้งเตือนเมื่อการจองได้รับการอนุมัติ
func (s *NotificationService) NotifyBookingApproved(bookingID int) error {
	booking, err := s.getBookingDetails(bookingID)
	if err != nil {
		return fmt.Errorf("failed to get booking details: %w", err)
	}

	message := fmt.Sprintf("การจองห้อง %s ในวันที่ %s ได้รับการอนุมัติแล้ว",
		booking.Room.Name,
		booking.BookingDate.Time.Format("02/01/2006"),
	)

	notificationID, err := s.createNotification(booking.UserID, bookingID, "booking_approved", message)
	if err != nil {
		return err
	}

	go s.sendBookingEmail(notificationID, booking, "booking_approved.html", "🎉 การจองได้รับการอนุมัติแล้ว")

	return nil
}

// NotifyBookingRejected - แจ้งเตือนเมื่อการจองถูกปฏิเสธ
func (s *NotificationService) NotifyBookingRejected(bookingID int, reason string) error {
	booking, err := s.getBookingDetails(bookingID)
	if err != nil {
		return fmt.Errorf("failed to get booking details: %w", err)
	}

	message := fmt.Sprintf("การจองห้อง %s ในวันที่ %s ถูกปฏิเสธ",
		booking.Room.Name,
		booking.BookingDate.Time.Format("02/01/2006"),
	)
	if reason != "" {
		message += fmt.Sprintf(" - เหตุผล: %s", reason)
	}

	notificationID, err := s.createNotification(booking.UserID, bookingID, "booking_rejected", message)
	if err != nil {
		return err
	}

	go s.sendBookingEmail(notificationID, booking, "booking_rejected.html", "❌ การจองถูกปฏิเสธ")

	return nil
}

// NotifyBookingCancelled - แจ้งเตือนเมื่อการจองถูกยกเลิก
func (s *NotificationService) NotifyBookingCancelled(bookingID int, reason string) error {
	booking, err := s.getBookingDetails(bookingID)
	if err != nil {
		return fmt.Errorf("failed to get booking details: %w", err)
	}

	message := fmt.Sprintf("การจองห้อง %s ในวันที่ %s ถูกยกเลิกแล้ว",
		booking.Room.Name,
		booking.BookingDate.Time.Format("02/01/2006"),
	)
	if reason != "" {
		message += fmt.Sprintf(" - %s", reason)
	}

	notificationID, err := s.createNotification(booking.UserID, bookingID, "booking_cancelled", message)
	if err != nil {
		return err
	}

	go s.sendBookingEmail(notificationID, booking, "booking_cancelled.html", "🚫 การจองถูกยกเลิก")

	return nil
}

// NotifyBookingReminder - แจ้งเตือนล่วงหน้าก่อนถึงเวลาจอง
func (s *NotificationService) NotifyBookingReminder(bookingID int) error {
	booking, err := s.getBookingDetails(bookingID)
	if err != nil {
		return fmt.Errorf("failed to get booking details: %w", err)
	}

	message := fmt.Sprintf("อย่าลืม! คุณมีการจองห้อง %s ในวันพรุ่งนี้ เวลา %s-%s",
		booking.Room.Name,
		booking.StartTime,
		booking.EndTime,
	)

	notificationID, err := s.createNotification(booking.UserID, bookingID, "booking_reminder", message)
	if err != nil {
		return err
	}

	go s.sendBookingEmail(notificationID, booking, "booking_reminder.html", "⏰ แจ้งเตือน: การจองของคุณใกล้ถึงกำหนด")

	return nil
}

// createNotification - สร้าง notification record ใน database
func (s *NotificationService) createNotification(userID, bookingID int, notifType, message string) (int, error) {
	notification := models.Notification{
		UserID:    userID,
		BookingID: bookingID,
		Type:      notifType,
		Message:   message,
		IsRead:    false,
		EmailSent: false,
		CreatedAt: time.Now(),
	}

	if err := s.DB.Create(&notification).Error; err != nil {
		log.Printf("❌ Failed to create notification: %v\n", err)
		return 0, fmt.Errorf("failed to create notification: %w", err)
	}

	log.Printf("✅ Notification created: ID=%d, Type=%s, UserID=%d, BookingID=%d\n",
		notification.NotificationID, notifType, userID, bookingID)

	return notification.NotificationID, nil
}

// getBookingDetails - ดึงข้อมูล booking พร้อม relations
func (s *NotificationService) getBookingDetails(bookingID int) (*models.Booking, error) {
	var booking models.Booking
	if err := s.DB.
		Preload("User").
		Preload("Room.Building").
		First(&booking, "booking_id = ?", bookingID).Error; err != nil {
		return nil, fmt.Errorf("booking not found: %w", err)
	}
	return &booking, nil
}

// sendBookingEmail - ส่งอีเมลพร้อมอัปเดต notification record
func (s *NotificationService) sendBookingEmail(notificationID int, booking *models.Booking, templateName, subject string) {
	// ตรวจสอบว่า user มี email หรือไม่
	if booking.User.Email == "" {
		log.Printf("⚠️  User ID=%d has no email, skipping email notification\n", booking.UserID)
		s.updateEmailStatus(notificationID, false, "User has no email address")
		return
	}

	// เตรียมข้อมูลสำหรับ template
	data := s.prepareEmailData(booking)

	// สร้าง email job
	emailJob := &EmailJob{
		To:           booking.User.Email,
		Subject:      subject,
		TemplateName: templateName,
		Data:         data,
	}

	// ส่งอีเมล
	if err := s.EmailService.SendEmail(emailJob); err != nil {
		log.Printf("❌ Failed to queue email for notification ID=%d: %v\n", notificationID, err)
		s.updateEmailStatus(notificationID, false, err.Error())
		return
	}

	// อัปเดตสถานะการส่งอีเมล
	s.updateEmailStatus(notificationID, true, "")
	log.Printf("📧 Email queued successfully for notification ID=%d\n", notificationID)
}

// prepareEmailData - เตรียมข้อมูลสำหรับ email template
func (s *NotificationService) prepareEmailData(booking *models.Booking) map[string]interface{} {
	// กำหนดข้อความสถานะ
	statusText := map[string]string{
		"pending":   "รอการอนุมัติ",
		"approved":  "อนุมัติแล้ว",
		"rejected":  "ปฏิเสธ",
		"cancelled": "ยกเลิกแล้ว",
		"completed": "เสร็จสิ้น",
	}

	roomName := "ไม่ระบุ"
	buildingName := "ไม่ระบุ"
	if booking.Room.Name != "" {
		roomName = booking.Room.Name
	}
	if booking.Room.Building.Name != "" {
		buildingName = booking.Room.Building.Name
	}

	data := map[string]interface{}{
		"UserName":          booking.User.Fullname,
		"BookingID":         booking.BookingID,
		"RoomName":          roomName,
		"BuildingName":      buildingName,
		"Title":             booking.Title,
		"BookingDate":       booking.BookingDate.Time.Format("02 January 2006"),
		"StartTime":         booking.StartTime,
		"EndTime":           booking.EndTime,
		"Status":            booking.Status,
		"StatusText":        statusText[booking.Status],
		"StatusNote":        booking.StatusNote,
		"ViewBookingURL":    fmt.Sprintf("%s/my-bookings", s.BaseURL),
		"BookNewURL":        fmt.Sprintf("%s/booking", s.BaseURL),
		"CancelBookingURL":  fmt.Sprintf("%s/my-bookings", s.BaseURL),
	}

	return data
}

// updateEmailStatus - อัปเดตสถานะการส่งอีเมลใน notification record
func (s *NotificationService) updateEmailStatus(notificationID int, success bool, errorMsg string) {
	now := time.Now()
	updates := map[string]interface{}{
		"email_sent": success,
		"email_sent_at": now,
	}

	if errorMsg != "" {
		updates["email_error"] = errorMsg
	}

	if err := s.DB.Model(&models.Notification{}).
		Where("notification_id = ?", notificationID).
		Updates(updates).Error; err != nil {
		log.Printf("❌ Failed to update email status for notification ID=%d: %v\n", notificationID, err)
	}
}

// GetUserNotifications - ดึง notifications ของ user
func (s *NotificationService) GetUserNotifications(userID int, limit int, unreadOnly bool) ([]models.Notification, error) {
	var notifications []models.Notification

	query := s.DB.Where("user_id = ?", userID).Order("created_at DESC")

	if unreadOnly {
		query = query.Where("is_read = ?", false)
	}

	if limit > 0 {
		query = query.Limit(limit)
	}

	if err := query.Find(&notifications).Error; err != nil {
		return nil, fmt.Errorf("failed to get notifications: %w", err)
	}

	return notifications, nil
}

// MarkAsRead - ทำเครื่องหมายว่าอ่านแล้ว
func (s *NotificationService) MarkAsRead(notificationID int, userID int) error {
	result := s.DB.Model(&models.Notification{}).
		Where("notification_id = ? AND user_id = ?", notificationID, userID).
		Update("is_read", true)

	if result.Error != nil {
		return fmt.Errorf("failed to mark as read: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("notification not found or access denied")
	}

	return nil
}

// MarkAllAsRead - ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
func (s *NotificationService) MarkAllAsRead(userID int) error {
	if err := s.DB.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Update("is_read", true).Error; err != nil {
		return fmt.Errorf("failed to mark all as read: %w", err)
	}

	return nil
}

// DeleteNotification - ลบ notification
func (s *NotificationService) DeleteNotification(notificationID int, userID int) error {
	result := s.DB.Where("notification_id = ? AND user_id = ?", notificationID, userID).
		Delete(&models.Notification{})

	if result.Error != nil {
		return fmt.Errorf("failed to delete notification: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("notification not found or access denied")
	}

	return nil
}
