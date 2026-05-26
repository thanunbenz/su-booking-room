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
	NotifyCancellationRequested(bookingID int, reason string) error
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

	// Filter by exact date (single day)
	if date := c.Query("booking_date"); date != "" {
		parsedDate, err := time.Parse("2006-01-02", date)
		if err != nil {
			return utils.BadRequestResponse(c, "Invalid date format. Use YYYY-MM-DD")
		}
		// Match any booking whose range contains this date (multi-day aware)
		query = query.Where("booking_date <= ? AND end_date >= ?",
			parsedDate.Format("2006-01-02"), parsedDate.Format("2006-01-02"))
	}

	// Filter by date range (overlaps [from, to]) — used by the calendar view
	if from := c.Query("from"); from != "" {
		if _, err := time.Parse("2006-01-02", from); err != nil {
			return utils.BadRequestResponse(c, "Invalid 'from' format. Use YYYY-MM-DD")
		}
		query = query.Where("end_date >= ?", from)
	}
	if to := c.Query("to"); to != "" {
		if _, err := time.Parse("2006-01-02", to); err != nil {
			return utils.BadRequestResponse(c, "Invalid 'to' format. Use YYYY-MM-DD")
		}
		query = query.Where("booking_date <= ?", to)
	}

	if err := query.Find(&bookings).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, bookings, "Success")
}

// PublicCalendarBooking is the sanitized shape returned to unauthenticated
// viewers of the calendar. It omits user PII (name/email) and booking detail
// fields that could leak organizational information. Only approved bookings
// are ever returned.
type PublicCalendarBooking struct {
	BookingID   int               `json:"booking_id"`
	RoomID      int               `json:"room_id"`
	RoomName    string            `json:"room_name"`
	BuildingID  int               `json:"building_id"`
	Title       string            `json:"title"`
	BookingDate models.CustomDate `json:"booking_date"`
	EndDate     models.CustomDate `json:"end_date"`
	StartTime   string            `json:"start_time"`
	EndTime     string            `json:"end_time"`
	Status      string            `json:"status"`
}

// GetPublicCalendar - GET /bookings/public-calendar (Public - ไม่ต้อง login)
// คืนค่าเฉพาะการจองที่อนุมัติแล้ว พร้อม sanitize ข้อมูลผู้ใช้ออก
// เพื่อให้คนนอกระบบดูปฏิทินการใช้ห้องได้โดยไม่เปิดเผยข้อมูลผู้ใช้
func (h *BookingHandler) GetPublicCalendar(c *fiber.Ctx) error {
	query := h.DB.Model(&models.Booking{}).
		Preload("Room.Building").
		Where("status = ?", "approved").
		Order("booking_date ASC, start_time ASC")

	if from := c.Query("from"); from != "" {
		if _, err := time.Parse("2006-01-02", from); err != nil {
			return utils.BadRequestResponse(c, "Invalid 'from' format. Use YYYY-MM-DD")
		}
		query = query.Where("end_date >= ?", from)
	}
	if to := c.Query("to"); to != "" {
		if _, err := time.Parse("2006-01-02", to); err != nil {
			return utils.BadRequestResponse(c, "Invalid 'to' format. Use YYYY-MM-DD")
		}
		query = query.Where("booking_date <= ?", to)
	}
	if roomID := c.Query("room_id"); roomID != "" {
		query = query.Where("room_id = ?", roomID)
	}

	var bookings []models.Booking
	if err := query.Find(&bookings).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// Project to the sanitized DTO — drops UserID, User, Detail, EquipmentRequest,
	// StatusNote so nothing user-identifying leaks.
	out := make([]PublicCalendarBooking, 0, len(bookings))
	for _, b := range bookings {
		out = append(out, PublicCalendarBooking{
			BookingID:   b.BookingID,
			RoomID:      b.RoomID,
			RoomName:    b.Room.Name,
			BuildingID:  b.Room.BuildingID,
			Title:       b.Title,
			BookingDate: b.BookingDate,
			EndDate:     b.EndDate,
			StartTime:   b.StartTime,
			EndTime:     b.EndTime,
			Status:      b.Status,
		})
	}

	return utils.StandardResponse(c, fiber.StatusOK, out, "Success")
}

// GetByRoomAndDate - GET /bookings/room/:room_id/availability (ดูการจองของห้องตามวันที่ - สำหรับตรวจสอบความว่าง)
func (h *BookingHandler) GetByRoomAndDate(c *fiber.Ctx) error {
	roomID, _ := strconv.Atoi(c.Params("room_id"))
	date := c.Query("date") // format: YYYY-MM-DD

	var bookings []models.Booking
	query := h.DB.Preload("User.Role").
		Where("room_id = ? AND status IN ?", roomID, models.BookingStatusesOccupyingRoom).
		Order("start_time ASC")

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

	// Parse body
	if err := c.BodyParser(&input); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body: "+err.Error())
	}

	// ดึง userID จาก JWT token
	userID := c.Locals("user_id").(uint)
	roleID, _ := c.Locals("role_id").(uint)
	isAdmin := roleID == 1

	// Admin จองแทนผู้อื่นได้: ถ้า body ส่ง user_id มา และเป็น admin → ใช้ค่าจาก body
	// ผู้ใช้ทั่วไปจะโดน override เป็น JWT user เสมอ (ป้องกันการปลอมตัว)
	if isAdmin && input.UserID > 0 {
		// ตรวจสอบว่ามี user นี้อยู่จริง
		var targetUser models.User
		if err := h.DB.First(&targetUser, "user_id = ?", input.UserID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return utils.BadRequestResponse(c, "ผู้ใช้ที่ระบุไม่พบในระบบ")
			}
			return utils.InternalServerErrorResponse(c, err.Error())
		}
	} else {
		input.UserID = int(userID)
	}

	// Default end_date to booking_date when the client omits it (single-day booking).
	// Must run BEFORE ValidateStruct because EndDate has `validate:"required"`.
	if input.EndDate.Time.IsZero() {
		input.EndDate = input.BookingDate
	}

	// Validate struct using validator
	if validationErrors := utils.ValidateStruct(input); validationErrors != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Validation failed",
				"details": validationErrors,
			},
		})
	}

	// Validate start_time < end_time
	if input.StartTime >= input.EndTime {
		return utils.BadRequestResponse(c, "Start time must be before end time")
	}

	// Validate booking date range
	today := time.Now().UTC().Truncate(24 * time.Hour)
	bookingDate := input.BookingDate.Time.UTC().Truncate(24 * time.Hour)
	endDate := input.EndDate.Time.UTC().Truncate(24 * time.Hour)
	if bookingDate.Before(today) {
		return utils.BadRequestResponse(c, "Cannot book in the past")
	}
	if endDate.Before(bookingDate) {
		return utils.BadRequestResponse(c, "end_date ต้องไม่น้อยกว่า booking_date")
	}
	const maxRangeDays = 30
	if endDate.Sub(bookingDate).Hours()/24 > maxRangeDays {
		return utils.BadRequestResponse(c,
			fmt.Sprintf("ช่วงวันที่จองยาวเกิน %d วัน", maxRangeDays))
	}

	// ตรวจสอบว่าห้องมีอยู่จริง
	var room models.Room
	if err := h.DB.First(&room, "room_id = ?", input.RoomID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Room not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// ตรวจสอบว่าเวลาไม่ซ้อนทับกับการจองอื่น (เฉพาะที่ approved หรือ pending)
	// Range overlap: (a.booking_date <= b.end_date) AND (a.end_date >= b.booking_date)
	// Time overlap:  a.start_time < b.end_time AND a.end_time > b.start_time
	var conflictCount int64
	h.DB.Model(&models.Booking{}).
		Where("room_id = ? AND status IN ?", input.RoomID, models.BookingStatusesOccupyingRoom).
		Where("booking_date <= ? AND end_date >= ?", input.EndDate.Time, input.BookingDate.Time).
		Where("start_time < ? AND end_time > ?", input.EndTime, input.StartTime).
		Count(&conflictCount)

	if conflictCount > 0 {
		return utils.ConflictResponse(c, "Time slot is already booked")
	}

	// ตรวจสอบว่าเวลาไม่ซ้อนกับตารางการจอง (fixed schedule) — เช็คทุกวันในช่วง
	for d := input.BookingDate.Time; !d.After(input.EndDate.Time); d = d.AddDate(0, 0, 1) {
		dayOfWeek := int(d.Weekday())
		if dayOfWeek == 0 {
			dayOfWeek = 7 // Sunday = 7
		}
		var scheduleConflictCount int64
		h.DB.Model(&models.FixedSchedule{}).
			Where("room_id = ? AND day_of_week = ?", input.RoomID, dayOfWeek).
			Where("start_time < ? AND end_time > ?", input.EndTime, input.StartTime).
			Count(&scheduleConflictCount)
		if scheduleConflictCount > 0 {
			return utils.ConflictResponse(c,
				fmt.Sprintf("วันที่ %s ซ้อนกับตารางประจำของห้อง", d.Format("2006-01-02")))
		}
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
		"completed": true,
	}
	if !validStatuses[input.Status] {
		return utils.BadRequestResponse(c, "Invalid status")
	}

	// Admin ยกเลิกต้องผ่าน flow ขอความยินยอมผู้จองก่อน
	if input.Status == "cancelled" {
		return utils.BadRequestResponse(c,
			"ไม่สามารถตั้งสถานะ cancelled โดยตรง กรุณาใช้ POST /bookings/:id/cancellation/request")
	}
	if input.Status == "pending_cancellation" {
		return utils.BadRequestResponse(c,
			"ไม่สามารถตั้งสถานะ pending_cancellation โดยตรง กรุณาใช้ POST /bookings/:id/cancellation/request")
	}

	// Update
	booking.Status = input.Status
	booking.ClearCancellationRequest()
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

	// ตรวจสอบว่ายกเลิกได้หรือไม่
	switch booking.Status {
	case "pending", "approved":
		// ยกเลิกทันที (ผู้จองเอง)
	case "pending_cancellation":
		return utils.BadRequestResponse(c,
			"มีคำขอยกเลิกจากแอดมินรออยู่ กรุณาใช้ POST /bookings/:id/cancellation/confirm หรือ /cancellation/reject")
	default:
		return utils.BadRequestResponse(c, "Cannot cancel booking with status: "+booking.Status)
	}

	// Update status to cancelled
	booking.Status = "cancelled"
	booking.StatusNote = "Cancelled by user"
	booking.ClearCancellationRequest()
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

// RequestCancellation - POST /bookings/:id/cancellation/request (Admin)
// ขอยกเลิก — ต้องรอผู้จองยืนยันก่อนจึงจะ cancelled จริง
func (h *BookingHandler) RequestCancellation(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	adminID := int(c.Locals("user_id").(uint))

	var booking models.Booking
	if err := h.DB.Preload("User.Role").Preload("Room.Building").
		First(&booking, "booking_id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Booking not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	if booking.Status == "pending_cancellation" {
		return utils.ConflictResponse(c, "มีคำขอยกเลิกรอการยืนยันอยู่แล้ว")
	}
	if booking.Status != "pending" && booking.Status != "approved" {
		return utils.BadRequestResponse(c, "ขอยกเลิกได้เฉพาะการจองที่รออนุมัติหรืออนุมัติแล้ว (สถานะปัจจุบัน: "+booking.Status+")")
	}

	var input struct {
		Reason string `json:"reason"`
	}
	if err := c.BodyParser(&input); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body " + err.Error())
	}

	now := time.Now()
	booking.PreviousStatus = booking.Status
	booking.Status = "pending_cancellation"
	booking.StatusNote = input.Reason
	booking.CancellationRequestedAt = &now
	booking.CancellationRequestedBy = &adminID
	booking.UpdatedAt = now

	if err := h.DB.Save(&booking).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	if h.NotifService != nil {
		go h.NotifService.NotifyCancellationRequested(booking.BookingID, input.Reason)
	}

	return utils.StandardResponse(c, fiber.StatusOK, booking,
		"ส่งคำขอยกเลิกแล้ว รอผู้จองยืนยัน")
}

// ConfirmCancellation - POST /bookings/:id/cancellation/confirm (เจ้าของการจอง)
func (h *BookingHandler) ConfirmCancellation(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	userID := int(c.Locals("user_id").(uint))

	booking, err := h.loadBookingPendingCancellation(c, id, userID)
	if err != nil || booking == nil {
		return err
	}

	reason := booking.StatusNote
	booking.Status = "cancelled"
	if reason == "" {
		booking.StatusNote = "ยกเลิกตามคำขอของแอดมิน (ผู้จองยืนยันแล้ว)"
	}
	booking.ClearCancellationRequest()
	booking.UpdatedAt = time.Now()

	if err := h.DB.Save(&booking).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	if h.NotifService != nil {
		go h.NotifService.NotifyBookingCancelled(booking.BookingID, booking.StatusNote)
	}

	return utils.StandardResponse(c, fiber.StatusOK, booking, "ยืนยันการยกเลิกแล้ว")
}

// RejectCancellation - POST /bookings/:id/cancellation/reject (เจ้าของการจอง)
func (h *BookingHandler) RejectCancellation(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	userID := int(c.Locals("user_id").(uint))

	booking, err := h.loadBookingPendingCancellation(c, id, userID)
	if err != nil || booking == nil {
		return err
	}

	restore := booking.PreviousStatus
	if restore == "" {
		restore = "approved"
	}
	booking.Status = restore
	booking.StatusNote = ""
	booking.ClearCancellationRequest()
	booking.UpdatedAt = time.Now()

	if err := h.DB.Save(&booking).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, booking, "ปฏิเสธคำขอยกเลิกแล้ว การจองยังคงมีผล")
}

func (h *BookingHandler) loadBookingPendingCancellation(c *fiber.Ctx, id, userID int) (*models.Booking, error) {
	var booking models.Booking
	if err := h.DB.Preload("User.Role").Preload("Room.Building").
		First(&booking, "booking_id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, utils.NotFoundResponse(c, "Booking not found")
		}
		return nil, utils.InternalServerErrorResponse(c, err.Error())
	}

	if booking.UserID != userID {
		return nil, utils.ForbiddenResponse(c, "เฉพาะเจ้าของการจองเท่านั้นที่ยืนยันหรือปฏิเสธคำขอยกเลิกได้")
	}
	if booking.Status != "pending_cancellation" {
		return nil, utils.BadRequestResponse(c, "ไม่มีคำขอยกเลิกที่รอการยืนยัน")
	}
	return &booking, nil
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

// pdfOptionsFromQuery reads style/footer options from query string.
// Accepts ?style=notice|report  &  ?footer=1|0 (default: notice, footer=1).
func pdfOptionsFromQuery(c *fiber.Ctx) utils.PDFOptions {
	opts := utils.DefaultPDFOptions()
	if s := c.Query("style"); s == string(utils.PDFStyleReport) {
		opts.Style = utils.PDFStyleReport
	}
	if f := c.Query("footer"); f == "0" || f == "false" {
		opts.ShowFooter = false
	}
	return opts
}

// DownloadPDF - GET /bookings/:id/pdf (Admin only - ดาวน์โหลดใบยืนยันการจองเป็น PDF)
// Query params: ?style=notice|report (default notice), ?footer=0|1 (default 1)
func (h *BookingHandler) DownloadPDF(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return utils.BadRequestResponse(c, "Invalid booking id")
	}

	var booking models.Booking
	if err := h.DB.
		Preload("User.Role").
		Preload("Room.Building").
		First(&booking, "booking_id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Booking not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	if booking.Status != "approved" {
		return utils.BadRequestResponse(c, "พิมพ์ PDF ได้เฉพาะการจองที่อนุมัติแล้วเท่านั้น")
	}

	pdfBytes, err := utils.GenerateBookingPDF(&booking, pdfOptionsFromQuery(c))
	if err != nil {
		return utils.InternalServerErrorResponse(c, "Failed to generate PDF: "+err.Error())
	}

	c.Set("Content-Type", "application/pdf")
	c.Set("Content-Disposition", fmt.Sprintf(`attachment; filename="booking-%d.pdf"`, id))
	return c.Send(pdfBytes)
}

// maxBatchPDFBookings caps how many bookings can be rendered in one batch
// call — protects against OOM / CPU exhaustion from a runaway client.
const maxBatchPDFBookings = 200

// BatchPDFRequest is the body for POST /bookings/pdf/batch.
// Provide either IDs (explicit selection) or Filter.
type BatchPDFRequest struct {
	IDs        []int  `json:"ids"`
	Style      string `json:"style"`       // "notice" | "report"
	ShowFooter *bool  `json:"show_footer"` // pointer so we distinguish unset vs false
	Filter     *struct {
		RoomID      int    `json:"room_id"`
		BookingDate string `json:"booking_date"`
	} `json:"filter"`
}

// DownloadBatchPDF - POST /bookings/pdf/batch (Admin only)
// Body: { ids?: [int], filter?: {...}, style?: "notice"|"report", show_footer?: bool }
// Either `ids` or `filter` must be provided. At least one matching booking is required.
func (h *BookingHandler) DownloadBatchPDF(c *fiber.Ctx) error {
	var req BatchPDFRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body: "+err.Error())
	}

	if len(req.IDs) > maxBatchPDFBookings {
		return utils.BadRequestResponse(c,
			fmt.Sprintf("ขอ PDF ได้ครั้งละไม่เกิน %d รายการ", maxBatchPDFBookings))
	}

	// PDFs are only issued for approved bookings — enforce server-side.
	query := h.DB.
		Preload("User.Role").
		Preload("Room.Building").
		Where("status = ?", "approved").
		Order("booking_date ASC, start_time ASC").
		Limit(maxBatchPDFBookings + 1) // +1 so we can detect overflow

	switch {
	case len(req.IDs) > 0:
		query = query.Where("booking_id IN ?", req.IDs)
	case req.Filter != nil:
		if req.Filter.RoomID > 0 {
			query = query.Where("room_id = ?", req.Filter.RoomID)
		}
		if req.Filter.BookingDate != "" {
			query = query.Where("booking_date = ?", req.Filter.BookingDate)
		}
	default:
		return utils.BadRequestResponse(c, "Provide either 'ids' or 'filter'")
	}

	var bookings []models.Booking
	if err := query.Find(&bookings).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}
	if len(bookings) == 0 {
		return utils.NotFoundResponse(c, "ไม่มีการจองที่อนุมัติแล้วตรงกับเงื่อนไข")
	}
	if len(bookings) > maxBatchPDFBookings {
		return utils.BadRequestResponse(c,
			fmt.Sprintf("เงื่อนไขนี้มีรายการเกิน %d กรุณากรองให้แคบลง", maxBatchPDFBookings))
	}

	opts := utils.DefaultPDFOptions()
	if req.Style == string(utils.PDFStyleReport) {
		opts.Style = utils.PDFStyleReport
	}
	if req.ShowFooter != nil {
		opts.ShowFooter = *req.ShowFooter
	}

	pdfBytes, err := utils.GenerateBookingsPDF(bookings, opts)
	if err != nil {
		return utils.InternalServerErrorResponse(c, "Failed to generate PDF: "+err.Error())
	}

	filename := "bookings"
	if opts.Style == utils.PDFStyleReport {
		filename += "-report"
	}
	filename += fmt.Sprintf("-%s.pdf", time.Now().Format("20060102-150405"))

	c.Set("Content-Type", "application/pdf")
	c.Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	return c.Send(pdfBytes)
}
