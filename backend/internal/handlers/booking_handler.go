package handlers

import (
	"fmt"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/thanunbenz/su-booking-room/internal/models"
	"github.com/thanunbenz/su-booking-room/internal/utils"
	"gorm.io/gorm"
)

// BookingHandler - Handler สำหรับจัดการการจองห้อง
type BookingHandler struct {
	DB           *gorm.DB
	NotifService NotificationService
}

// NotificationService - interface สำหรับ notification service
type NotificationService interface {
	NotifyBookingCreated(bookingID int) error
	NotifyBookingApproved(bookingID int) error
	NotifyBookingRejected(bookingID int, reason string) error
	NotifyBookingCancelled(bookingID int, reason string) error
}

func NewBookingHandler(db *gorm.DB, notifService NotificationService) *BookingHandler {
	return &BookingHandler{
		DB:           db,
		NotifService: notifService,
	}
}

// GetAll - GET /bookings (Admin only - ดูการจองทั้งหมด)
func (h *BookingHandler) GetAll(c *fiber.Ctx) error {
	var bookings []models.Booking

	query := h.DB.Preload("User.Role").Order("created_at DESC")

	// Filter by status
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// Filter by room_id
	if roomID := c.Query("room_id"); roomID != "" {
		query = query.Where("room_id = ?", roomID)
	}

	// Filter by date
	if date := c.Query("booking_date"); date != "" {
        parsedDate, err := time.Parse("2006-01-02", date)
        if err != nil {
            return utils.BadRequestResponse(c, "Invalid date format. Use YYYY-MM-DD")
        }
        // Query โดยเปรียบเทียบแค่วันที่ (ไม่รวมเวลา)
		print("asdas")
        query = query.Where("DATE(booking_date) = ?", parsedDate.Format("2006-01-02"))
    }

	if err := query.Find(&bookings).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, bookings, "Success")
}

// GetByRoomAndDate - GET /bookings/room/:room_id/availability (ดูการจองของห้องตามวันที่ - สำหรับตรวจสอบความว่าง)
func (h *BookingHandler) GetByRoomAndDate(c *fiber.Ctx) error {
	roomID, _ := strconv.Atoi(c.Params("room_id"))
	date := c.Query("date") // format: YYYY-MM-DD

	var bookings []models.Booking
	query := h.DB.Preload("User.Role").Where("room_id = ? AND status IN (?, ?)", roomID, "pending", "approved").Order("start_time ASC")

	// Filter by date if provided
	if date != "" {
		parsedDate, err := time.Parse("2006-01-02", date)
		if err != nil {
			return utils.BadRequestResponse(c, "Invalid date format. Use YYYY-MM-DD")
		}
		query = query.Where("booking_date = ?", parsedDate)
	}

	if err := query.Find(&bookings).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, bookings, "Success")
}

// GetMyBookings - GET /bookings/my (ดูการจองของตัวเอง)
func (h *BookingHandler) GetMyBookings(c *fiber.Ctx) error {
	// ดึง userID จาก JWT token (ผ่าน middleware)
	userID := c.Locals("user_id").(uint)

	var bookings []models.Booking
	if err := h.DB.Preload("User.Role").Where("user_id = ?", userID).Order("created_at DESC").Find(&bookings).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, bookings, "Success")
}

// GetByID - GET /bookings/:id
func (h *BookingHandler) GetByID(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	var booking models.Booking
	if err := h.DB.Preload("User.Role").Preload("Room.Building").First(&booking, "booking_id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Booking not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// ตรวจสอบสิทธิ์: เฉพาะ Admin หรือเจ้าของการจองเท่านั้น
	userID := c.Locals("user_id").(uint)
	roleID := c.Locals("role_id").(uint)

	if roleID != 1 && booking.UserID != int(userID) { // roleID 1 = admin
		return utils.ForbiddenResponse(c, "You don't have permission to view this booking")
	}

	return utils.StandardResponse(c, fiber.StatusOK, booking, "Success")
}

// Create - POST /bookings (สร้างการจองใหม่)
func (h *BookingHandler) Create(c *fiber.Ctx) error {
	var input models.Booking

	fmt.Println("📥 Raw request body:", string(c.Body()))

	// Parse body
	if err := c.BodyParser(&input); err != nil {
		fmt.Println("❌ Body parsing failed. Error:", err.Error())
		return utils.BadRequestResponse(c, "Invalid request body")
	}

	fmt.Printf("✅ Parsed: RoomID=%d, Title='%s', Date=%v (IsZero=%v), Start='%s', End='%s'\n",
		input.RoomID, input.Title, input.BookingDate.Time, input.BookingDate.IsZero(), input.StartTime, input.EndTime)

	// ดึง userID จาก JWT token
	userID := c.Locals("user_id").(uint)
	input.UserID = int(userID)

	// Validate struct using validator
	if validationErrors := utils.ValidateStruct(input); validationErrors != nil {
		fmt.Printf("❌ Validation failed: %+v\n", validationErrors)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Validation failed",
				"details": validationErrors,
			},
		})
	}
	fmt.Println("✅ All required fields validated")

	// Validate start_time < end_time
	if input.StartTime >= input.EndTime {
		fmt.Printf("❌ Time validation failed: start=%s, end=%s\n", input.StartTime, input.EndTime)
		return utils.BadRequestResponse(c, "Start time must be before end time")
	}
	fmt.Println("✅ Time range is valid")

	// Validate booking date is not in the past (compare in UTC to avoid timezone issues)
	today := time.Now().UTC().Truncate(24 * time.Hour)
	bookingDate := input.BookingDate.Time.UTC().Truncate(24 * time.Hour)
	if bookingDate.Before(today) {
		fmt.Printf("❌ Date validation failed: bookingDate=%v, today=%v\n", bookingDate, today)
		return utils.BadRequestResponse(c, "Cannot book in the past")
	}
	fmt.Println("✅ Date is valid (not in the past)")

	// ตรวจสอบว่าห้องมีอยู่จริง
	var room models.Room
	if err := h.DB.First(&room, "room_id = ?", input.RoomID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Room not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// ตรวจสอบว่าเวลาไม่ซ้อนทับกับการจองอื่น (เฉพาะที่ approved หรือ pending)
	// Time overlap logic: existing.start_time < new.end_time AND existing.end_time > new.start_time
	var conflictCount int64
	h.DB.Model(&models.Booking{}).
		Where("room_id = ? AND booking_date = ? AND status IN (?, ?)", input.RoomID, input.BookingDate.Time, "pending", "approved").
		Where("start_time < ? AND end_time > ?", input.EndTime, input.StartTime).
		Count(&conflictCount)

	if conflictCount > 0 {
		return utils.ConflictResponse(c, "Time slot is already booked")
	}

	// ตรวจสอบว่าเวลาไม่ซ้อนกับตารางการจอง
	dayOfWeek := int(input.BookingDate.Time.Weekday())
	if dayOfWeek == 0 {
		dayOfWeek = 7 // Sunday = 7
	}

	var scheduleConflictCount int64
	h.DB.Model(&models.FixedSchedule{}).
		Where("room_id = ? AND day_of_week = ?", input.RoomID, dayOfWeek).
		Where("start_time < ? AND end_time > ?", input.EndTime, input.StartTime).
		Count(&scheduleConflictCount)

	if scheduleConflictCount > 0 {
		return utils.ConflictResponse(c, "Time slot conflicts with fixed schedule")
	}

	// Set default status
	input.Status = "approved" // เปลี่ยนเป็น "pending" ถ้าต้องการให้ admin อนุมัติก่อน
	input.CreatedAt = time.Now()
	input.UpdatedAt = time.Now()

	// บันทึก
	if err := h.DB.Create(&input).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// ส่ง notification (async - ไม่ block response)
	if h.NotifService != nil {
		go h.NotifService.NotifyBookingCreated(input.BookingID)
	}

	return utils.StandardResponse(c, fiber.StatusCreated, input, "Booking created successfully")
}

// UpdateStatus - PATCH /bookings/:id/status (Admin only - อนุมัติ/ปฏิเสธ/ยกเลิก)
func (h *BookingHandler) UpdateStatus(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	// หา booking
	var booking models.Booking
	if err := h.DB.First(&booking, "booking_id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Booking not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// Parse body
	var input struct {
		Status     string `json:"status"`
		StatusNote string `json:"status_note"`
	}
	if err := c.BodyParser(&input); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}

	// Validate status
	validStatuses := map[string]bool{
		"pending":   true,
		"approved":  true,
		"rejected":  true,
		"cancelled": true,
		"completed": true,
	}
	if !validStatuses[input.Status] {
		return utils.BadRequestResponse(c, "Invalid status")
	}

	// Update
	booking.Status = input.Status
	booking.StatusNote = input.StatusNote
	booking.UpdatedAt = time.Now()

	if err := h.DB.Save(&booking).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// ส่ง notification ตาม status (async)
	if h.NotifService != nil {
		go func() {
			switch booking.Status {
			case "approved":
				h.NotifService.NotifyBookingApproved(booking.BookingID)
			case "rejected":
				h.NotifService.NotifyBookingRejected(booking.BookingID, booking.StatusNote)
			case "cancelled":
				h.NotifService.NotifyBookingCancelled(booking.BookingID, booking.StatusNote)
			}
		}()
	}

	return utils.StandardResponse(c, fiber.StatusOK, booking, "Booking status updated successfully")
}

// Cancel - DELETE /bookings/:id/cancel (ยกเลิกการจองของตัวเอง)
func (h *BookingHandler) Cancel(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	userID := c.Locals("user_id").(uint)

	// หา booking
	var booking models.Booking
	if err := h.DB.First(&booking, "booking_id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Booking not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// ตรวจสอบว่าเป็นเจ้าของการจองหรือไม่
	if booking.UserID != int(userID) {
		return utils.ForbiddenResponse(c, "You can only cancel your own bookings")
	}

	// ตรวจสอบว่ายกเลิกได้หรือไม่ (เฉพาะ pending หรือ approved)
	if booking.Status != "pending" && booking.Status != "approved" {
		return utils.BadRequestResponse(c, "Cannot cancel booking with status: "+booking.Status)
	}

	// Update status to cancelled
	booking.Status = "cancelled"
	booking.StatusNote = "Cancelled by user"
	booking.UpdatedAt = time.Now()

	if err := h.DB.Save(&booking).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// ส่ง notification (async)
	if h.NotifService != nil {
		go h.NotifService.NotifyBookingCancelled(booking.BookingID, booking.StatusNote)
	}

	return utils.StandardResponse(c, fiber.StatusOK, booking, "Booking cancelled successfully")
}

// Delete - DELETE /bookings/:id (Admin only - ลบการจอง)
func (h *BookingHandler) Delete(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	// หา booking
	var booking models.Booking
	if err := h.DB.First(&booking, "booking_id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Booking not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// ลบ
	if err := h.DB.Delete(&booking).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, nil, "Booking deleted successfully")
}
