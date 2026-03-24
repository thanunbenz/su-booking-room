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

// MultiBookingHandler - Handler for multi-room booking operations
type MultiBookingHandler struct {
	DB           *gorm.DB
	NotifService NotificationService
}

func NewMultiBookingHandler(db *gorm.DB, notifService NotificationService) *MultiBookingHandler {
	return &MultiBookingHandler{
		DB:           db,
		NotifService: notifService,
	}
}

// CreateMultiBookingRequest - request body for creating multi-room booking
type CreateMultiBookingRequest struct {
	RoomIDs          []int  `json:"room_ids" validate:"required,min=2"`
	Title            string `json:"title" validate:"required,min=1,max=255"`
	Detail           string `json:"detail" validate:"omitempty,max=5000"`
	EquipmentRequest string `json:"equipment_request" validate:"omitempty,max=5000"`
	BookingDate      string `json:"booking_date" validate:"required"`
	StartTime        string `json:"start_time" validate:"required"`
	EndTime          string `json:"end_time" validate:"required"`
}

// CreateMulti - POST /bookings/multi (create multi-room booking)
func (h *MultiBookingHandler) CreateMulti(c *fiber.Ctx) error {
	var input CreateMultiBookingRequest

	// Parse body
	if err := c.BodyParser(&input); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}

	// Validate room_ids
	if len(input.RoomIDs) < 2 {
		return utils.BadRequestResponse(c, "Multi-room booking requires at least 2 rooms")
	}

	// Check for duplicate room IDs
	roomIDSet := make(map[int]bool)
	for _, roomID := range input.RoomIDs {
		if roomID <= 0 {
			return utils.BadRequestResponse(c, "Invalid room ID")
		}
		if roomIDSet[roomID] {
			return utils.BadRequestResponse(c, fmt.Sprintf("Duplicate room ID: %d", roomID))
		}
		roomIDSet[roomID] = true
	}

	// Validate title
	if input.Title == "" {
		return utils.BadRequestResponse(c, "Title is required")
	}

	// Validate booking date
	if input.BookingDate == "" {
		return utils.BadRequestResponse(c, "Booking date is required")
	}
	bookingDateParsed, err := time.Parse("2006-01-02", input.BookingDate)
	if err != nil {
		return utils.BadRequestResponse(c, "Invalid date format. Use YYYY-MM-DD")
	}

	// Validate booking date is not in the past
	today := time.Now().UTC().Truncate(24 * time.Hour)
	bookingDate := bookingDateParsed.UTC().Truncate(24 * time.Hour)
	if bookingDate.Before(today) {
		return utils.BadRequestResponse(c, "Cannot book in the past")
	}

	// Validate time
	if input.StartTime == "" || input.EndTime == "" {
		return utils.BadRequestResponse(c, "Start time and end time are required")
	}
	if input.StartTime >= input.EndTime {
		return utils.BadRequestResponse(c, "Start time must be before end time")
	}

	// Get user ID from JWT
	userID := c.Locals("user_id").(uint)

	// Validate all rooms exist
	var rooms []models.Room
	if err := h.DB.Where("room_id IN ?", input.RoomIDs).Find(&rooms).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}
	if len(rooms) != len(input.RoomIDs) {
		return utils.NotFoundResponse(c, "One or more rooms not found")
	}

	// Build CustomDate for booking
	var customDate models.CustomDate
	customDate.Time = bookingDateParsed

	// Create booking group and all bookings in a single transaction.
	// Conflict checks are performed inside the transaction with row-level locking
	// to prevent TOCTOU race conditions that could cause double-bookings.
	dayOfWeek := int(bookingDateParsed.Weekday())
	if dayOfWeek == 0 {
		dayOfWeek = 7 // Sunday = 7
	}

	var group models.BookingGroup
	var bookings []models.Booking
	var conflictMsg string

	txErr := h.DB.Transaction(func(tx *gorm.DB) error {
		// Lock all relevant room rows to serialize concurrent booking attempts.
		// Locking in sorted order prevents potential deadlocks.
		for _, roomID := range input.RoomIDs {
			if err := tx.Exec("SELECT 1 FROM rooms WHERE room_id = ? FOR UPDATE", roomID).Error; err != nil {
				return err
			}
		}

		// Check conflicts for each room (booking conflicts + fixed schedule conflicts)
		for _, roomID := range input.RoomIDs {
			// Check booking conflicts
			var conflictCount int64
			tx.Model(&models.Booking{}).
				Where("room_id = ? AND booking_date = ? AND status IN (?, ?)", roomID, bookingDateParsed, "pending", "approved").
				Where("start_time < ? AND end_time > ?", input.EndTime, input.StartTime).
				Count(&conflictCount)

			if conflictCount > 0 {
				roomName := fmt.Sprintf("Room ID %d", roomID)
				for _, r := range rooms {
					if r.RoomID == roomID {
						roomName = r.Name
						break
					}
				}
				conflictMsg = fmt.Sprintf("Time slot is already booked for room: %s", roomName)
				return fmt.Errorf("booking_conflict")
			}

			// Check fixed schedule conflicts
			var scheduleConflictCount int64
			tx.Model(&models.FixedSchedule{}).
				Where("room_id = ? AND day_of_week = ?", roomID, dayOfWeek).
				Where("start_time < ? AND end_time > ?", input.EndTime, input.StartTime).
				Count(&scheduleConflictCount)

			if scheduleConflictCount > 0 {
				roomName := fmt.Sprintf("Room ID %d", roomID)
				for _, r := range rooms {
					if r.RoomID == roomID {
						roomName = r.Name
						break
					}
				}
				conflictMsg = fmt.Sprintf("Time slot conflicts with fixed schedule for room: %s", roomName)
				return fmt.Errorf("schedule_conflict")
			}
		}

		// Create the booking group
		group = models.BookingGroup{
			UserID:    int(userID),
			Title:     input.Title,
			CreatedAt: time.Now(),
		}
		if err := tx.Create(&group).Error; err != nil {
			return err
		}

		// Create a booking for each room
		now := time.Now()
		for _, roomID := range input.RoomIDs {
			groupID := group.GroupID
			booking := models.Booking{
				UserID:           int(userID),
				RoomID:           roomID,
				GroupID:          &groupID,
				Title:            input.Title,
				Detail:           input.Detail,
				EquipmentRequest: input.EquipmentRequest,
				BookingDate:      customDate,
				StartTime:        input.StartTime,
				EndTime:          input.EndTime,
				Status:           "approved",
				CreatedAt:        now,
				UpdatedAt:        now,
			}
			if err := tx.Create(&booking).Error; err != nil {
				return err
			}
			bookings = append(bookings, booking)
		}

		return nil
	})

	if txErr != nil {
		if conflictMsg != "" {
			return utils.ConflictResponse(c, conflictMsg)
		}
		return utils.InternalServerErrorResponse(c, txErr.Error())
	}

	// Load the full group with bookings and relations
	h.DB.Preload("User.Role").Preload("Bookings.Room.Building").First(&group, "group_id = ?", group.GroupID)

	// Send notifications for each booking (async)
	if h.NotifService != nil {
		for _, b := range bookings {
			bookingID := b.BookingID
			go h.NotifService.NotifyBookingCreated(bookingID)
		}
	}

	return utils.StandardResponse(c, fiber.StatusCreated, group, "Multi-room booking created successfully")
}

// GetByGroupID - GET /bookings/group/:group_id (get all bookings in a group)
func (h *MultiBookingHandler) GetByGroupID(c *fiber.Ctx) error {
	groupID, err := strconv.Atoi(c.Params("group_id"))
	if err != nil || groupID <= 0 {
		return utils.BadRequestResponse(c, "Invalid group ID")
	}

	var group models.BookingGroup
	if err := h.DB.Preload("User.Role").Preload("Bookings.Room.Building").Preload("Bookings.User.Role").First(&group, "group_id = ?", groupID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Booking group not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// Check permission: only admin or the owner can view
	userID := c.Locals("user_id").(uint)
	roleID := c.Locals("role_id").(uint)

	if roleID != 1 && group.UserID != int(userID) {
		return utils.ForbiddenResponse(c, "You don't have permission to view this booking group")
	}

	return utils.StandardResponse(c, fiber.StatusOK, group, "Success")
}

// CancelGroup - DELETE /bookings/group/:group_id (cancel entire group)
func (h *MultiBookingHandler) CancelGroup(c *fiber.Ctx) error {
	groupID, err := strconv.Atoi(c.Params("group_id"))
	if err != nil || groupID <= 0 {
		return utils.BadRequestResponse(c, "Invalid group ID")
	}

	userID := c.Locals("user_id").(uint)

	// Find the group
	var group models.BookingGroup
	if err := h.DB.Preload("Bookings").First(&group, "group_id = ?", groupID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Booking group not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// Check ownership
	if group.UserID != int(userID) {
		roleID := c.Locals("role_id").(uint)
		if roleID != 1 {
			return utils.ForbiddenResponse(c, "You can only cancel your own booking groups")
		}
	}

	// Check that at least one booking is cancellable
	hasCancellable := false
	for _, b := range group.Bookings {
		if b.Status == "pending" || b.Status == "approved" {
			hasCancellable = true
			break
		}
	}
	if !hasCancellable {
		return utils.BadRequestResponse(c, "No active bookings in this group to cancel")
	}

	// Cancel all bookings in the group within a transaction
	txErr := h.DB.Transaction(func(tx *gorm.DB) error {
		now := time.Now()
		for _, b := range group.Bookings {
			if b.Status == "pending" || b.Status == "approved" {
				if err := tx.Model(&models.Booking{}).
					Where("booking_id = ?", b.BookingID).
					Updates(map[string]interface{}{
						"status":      "cancelled",
						"status_note": "Cancelled as part of group cancellation",
						"updated_at":  now,
					}).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})

	if txErr != nil {
		return utils.InternalServerErrorResponse(c, txErr.Error())
	}

	// Reload the group with updated bookings
	h.DB.Preload("User.Role").Preload("Bookings.Room.Building").First(&group, "group_id = ?", groupID)

	// Send notifications (async)
	if h.NotifService != nil {
		for _, b := range group.Bookings {
			if b.Status == "cancelled" {
				bookingID := b.BookingID
				go h.NotifService.NotifyBookingCancelled(bookingID, "Cancelled as part of group cancellation")
			}
		}
	}

	return utils.StandardResponse(c, fiber.StatusOK, group, "Booking group cancelled successfully")
}
