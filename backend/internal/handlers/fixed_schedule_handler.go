package handlers

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/thanunbenz/su-booking-room/internal/models"
	"github.com/thanunbenz/su-booking-room/internal/utils"
	"gorm.io/gorm"
)

type FixedScheduleHandler struct {
	DB *gorm.DB
}

func NewFixedScheduleHandler(db *gorm.DB) *FixedScheduleHandler {
	return &FixedScheduleHandler{DB: db}
}

// CreateScheduleRequest DTO
type CreateScheduleRequest struct {
	RoomID      int    `json:"room_id" validate:"required"`
	Subject     string `json:"subject" validate:"required,min=1,max=255"`
	TeacherName string `json:"teacher_name" validate:"max=255"`
	DayOfWeek   int    `json:"day_of_week" validate:"required,min=1,max=7"`
	StartTime   string `json:"start_time" validate:"required"`
	EndTime     string `json:"end_time" validate:"required"`
	Semester    string `json:"semester" validate:"max=20"`
}

// BulkCreateScheduleRequest DTO for bulk creation
type BulkCreateScheduleRequest struct {
	Schedules []CreateScheduleRequest `json:"schedules" validate:"required,min=1,dive"`
}

// GetAll - GET /schedules
func (h *FixedScheduleHandler) GetAll(c *fiber.Ctx) error {
	var schedules []models.FixedSchedule

	// Query with Room preload (optional)
	query := h.DB

	// Filter by room_id if provided
	roomID := c.Query("room_id")
	if roomID != "" {
		query = query.Where("room_id = ?", roomID)
	}

	// Filter by day_of_week if provided
	dayOfWeek := c.Query("day_of_week")
	if dayOfWeek != "" {
		query = query.Where("day_of_week = ?", dayOfWeek)
	}

	// Filter by semester if provided
	semester := c.Query("semester")
	if semester != "" {
		query = query.Where("semester = ?", semester)
	}

	if err := query.Find(&schedules).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, schedules, "Success")
}

// GetByID - GET /schedules/:id
func (h *FixedScheduleHandler) GetByID(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return utils.BadRequestResponse(c, "Invalid schedule ID")
	}

	var schedule models.FixedSchedule
	if err := h.DB.First(&schedule, "schedule_id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Fixed schedule not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, schedule, "Success")
}

// GetByRoomID - GET /rooms/:id/schedules
func (h *FixedScheduleHandler) GetByRoomID(c *fiber.Ctx) error {
	roomID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return utils.BadRequestResponse(c, "Invalid room ID")
	}

	// ตรวจสอบว่า room มีอยู่ไหม
	var room models.Room
	if err := h.DB.First(&room, "room_id = ?", roomID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Room not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// ดึง schedules ของห้องนั้น
	var schedules []models.FixedSchedule
	query := h.DB.Where("room_id = ?", roomID)

	// Optional filter by day_of_week
	dayOfWeek := c.Query("day_of_week")
	if dayOfWeek != "" {
		query = query.Where("day_of_week = ?", dayOfWeek)
	}

	// Optional filter by semester
	semester := c.Query("semester")
	if semester != "" {
		query = query.Where("semester = ?", semester)
	}

	// Order by day_of_week and start_time
	query = query.Order("day_of_week ASC, start_time ASC")

	if err := query.Find(&schedules).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, schedules, "Success")
}

// Create - POST /schedules
func (h *FixedScheduleHandler) Create(c *fiber.Ctx) error {
	var req CreateScheduleRequest

	// Parse body
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}

	// Validate
	if errors := utils.ValidateStruct(req); errors != nil {
		return utils.ValidationErrorResponse(c, errors)
	}

	// Validate time format and logic
	if err := validateScheduleTime(req.StartTime, req.EndTime); err != nil {
		return utils.BadRequestResponse(c, err.Error())
	}

	// ตรวจสอบว่า room มีอยู่ไหม
	var room models.Room
	if err := h.DB.First(&room, "room_id = ?", req.RoomID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Room not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// ตรวจสอบ conflict กับ fixed schedule อื่น
	if conflict, err := h.checkScheduleConflict(req.RoomID, req.DayOfWeek, req.StartTime, req.EndTime, 0); err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	} else if conflict {
		return utils.ConflictResponse(c, "Schedule conflicts with an existing fixed schedule for this room")
	}

	// สร้าง schedule
	schedule := models.FixedSchedule{
		RoomID:      req.RoomID,
		Subject:     req.Subject,
		TeacherName: req.TeacherName,
		DayOfWeek:   req.DayOfWeek,
		StartTime:   req.StartTime,
		EndTime:     req.EndTime,
		Semester:    req.Semester,
	}

	if err := h.DB.Create(&schedule).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusCreated, schedule, "Fixed schedule created successfully")
}

// Update - PUT /schedules/:id
func (h *FixedScheduleHandler) Update(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return utils.BadRequestResponse(c, "Invalid schedule ID")
	}

	var req CreateScheduleRequest

	// Parse body
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}

	// Validate
	if errors := utils.ValidateStruct(req); errors != nil {
		return utils.ValidationErrorResponse(c, errors)
	}

	// Validate time format and logic
	if err := validateScheduleTime(req.StartTime, req.EndTime); err != nil {
		return utils.BadRequestResponse(c, err.Error())
	}

	// ตรวจสอบว่า schedule มีอยู่ไหม
	var schedule models.FixedSchedule
	if err := h.DB.First(&schedule, "schedule_id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Fixed schedule not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// ตรวจสอบว่า room มีอยู่ไหม
	var room models.Room
	if err := h.DB.First(&room, "room_id = ?", req.RoomID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Room not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// ตรวจสอบ conflict (exclude current schedule)
	if conflict, err := h.checkScheduleConflict(req.RoomID, req.DayOfWeek, req.StartTime, req.EndTime, id); err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	} else if conflict {
		return utils.ConflictResponse(c, "Schedule conflicts with an existing fixed schedule for this room")
	}

	// Update schedule
	schedule.RoomID = req.RoomID
	schedule.Subject = req.Subject
	schedule.TeacherName = req.TeacherName
	schedule.DayOfWeek = req.DayOfWeek
	schedule.StartTime = req.StartTime
	schedule.EndTime = req.EndTime
	schedule.Semester = req.Semester

	if err := h.DB.Save(&schedule).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, schedule, "Fixed schedule updated successfully")
}

// Delete - DELETE /schedules/:id
func (h *FixedScheduleHandler) Delete(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return utils.BadRequestResponse(c, "Invalid schedule ID")
	}

	// ตรวจสอบว่า schedule มีอยู่ไหม
	var schedule models.FixedSchedule
	if err := h.DB.First(&schedule, "schedule_id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Fixed schedule not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// ลบ schedule
	if err := h.DB.Delete(&schedule).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, nil, "Fixed schedule deleted successfully")
}

// BulkCreate - POST /schedules/bulk
func (h *FixedScheduleHandler) BulkCreate(c *fiber.Ctx) error {
	var req BulkCreateScheduleRequest

	// Parse body
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}

	// Validate
	if errors := utils.ValidateStruct(req); errors != nil {
		return utils.ValidationErrorResponse(c, errors)
	}

	if len(req.Schedules) == 0 {
		return utils.BadRequestResponse(c, "At least one schedule is required")
	}

	// ใช้ transaction เพื่อให้แน่ใจว่า ถ้ามี error ตัวใดตัวหนึ่ง จะ rollback ทั้งหมด
	tx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var createdSchedules []models.FixedSchedule

	// Validate และสร้าง schedules ทั้งหมด
	for i, schedReq := range req.Schedules {
		// Validate each schedule
		if errors := utils.ValidateStruct(schedReq); errors != nil {
			tx.Rollback()
			return utils.BadRequestResponse(c, "Validation failed at schedule index "+strconv.Itoa(i))
		}

		// Validate time
		if err := validateScheduleTime(schedReq.StartTime, schedReq.EndTime); err != nil {
			tx.Rollback()
			return utils.BadRequestResponse(c, "Schedule at index "+strconv.Itoa(i)+": "+err.Error())
		}

		// ตรวจสอบว่า room มีอยู่ไหม
		var room models.Room
		if err := tx.First(&room, "room_id = ?", schedReq.RoomID).Error; err != nil {
			tx.Rollback()
			if err == gorm.ErrRecordNotFound {
				return utils.NotFoundResponse(c, "Room not found at index "+strconv.Itoa(i))
			}
			return utils.InternalServerErrorResponse(c, err.Error())
		}

		// ตรวจสอบ conflict
		var count int64
		if err := tx.Model(&models.FixedSchedule{}).
			Where("room_id = ? AND day_of_week = ?", schedReq.RoomID, schedReq.DayOfWeek).
			Where("(start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?) OR (start_time >= ? AND end_time <= ?)",
				schedReq.EndTime, schedReq.StartTime,
				schedReq.EndTime, schedReq.EndTime,
				schedReq.StartTime, schedReq.EndTime).
			Count(&count).Error; err != nil {
			tx.Rollback()
			return utils.InternalServerErrorResponse(c, err.Error())
		}

		if count > 0 {
			tx.Rollback()
			return utils.ConflictResponse(c, "Schedule at index "+strconv.Itoa(i)+" conflicts with existing schedule")
		}

		// สร้าง schedule
		schedule := models.FixedSchedule{
			RoomID:      schedReq.RoomID,
			Subject:     schedReq.Subject,
			TeacherName: schedReq.TeacherName,
			DayOfWeek:   schedReq.DayOfWeek,
			StartTime:   schedReq.StartTime,
			EndTime:     schedReq.EndTime,
			Semester:    schedReq.Semester,
		}

		if err := tx.Create(&schedule).Error; err != nil {
			tx.Rollback()
			return utils.InternalServerErrorResponse(c, err.Error())
		}

		createdSchedules = append(createdSchedules, schedule)
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusCreated, map[string]interface{}{
		"schedules": createdSchedules,
		"count":     len(createdSchedules),
	}, "Fixed schedules created successfully")
}

// Helper function: checkScheduleConflict - ตรวจสอบว่ามี schedule ซ้ำไหม
func (h *FixedScheduleHandler) checkScheduleConflict(roomID int, dayOfWeek int, startTime string, endTime string, excludeScheduleID int) (bool, error) {
	query := h.DB.Model(&models.FixedSchedule{}).
		Where("room_id = ? AND day_of_week = ?", roomID, dayOfWeek)

	// Exclude current schedule (สำหรับ update)
	if excludeScheduleID > 0 {
		query = query.Where("schedule_id != ?", excludeScheduleID)
	}

	// Time overlap check: (new_start < existing_end) AND (new_end > existing_start)
	// OR new schedule completely contains existing schedule
	// OR new schedule is completely contained by existing schedule
	query = query.Where(
		"(start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?) OR (start_time >= ? AND end_time <= ?)",
		endTime, startTime,      // overlap at start
		endTime, endTime,        // overlap at end
		startTime, endTime,      // new contains existing
	)

	var count int64
	if err := query.Count(&count).Error; err != nil {
		return false, err
	}

	return count > 0, nil
}

// Helper function: validateScheduleTime - validate time format and logic
func validateScheduleTime(startTime string, endTime string) error {
	// Parse time format (HH:MM:SS or HH:MM)
	const timeFormat1 = "15:04:05"
	const timeFormat2 = "15:04"

	var start, end time.Time
	var err error

	// Try parsing with seconds
	start, err = time.Parse(timeFormat1, startTime)
	if err != nil {
		// Try parsing without seconds
		start, err = time.Parse(timeFormat2, startTime)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "Invalid start_time format. Use HH:MM or HH:MM:SS")
		}
	}

	// Try parsing with seconds
	end, err = time.Parse(timeFormat1, endTime)
	if err != nil {
		// Try parsing without seconds
		end, err = time.Parse(timeFormat2, endTime)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "Invalid end_time format. Use HH:MM or HH:MM:SS")
		}
	}

	// Check if start_time < end_time
	if !start.Before(end) {
		return fiber.NewError(fiber.StatusBadRequest, "start_time must be before end_time")
	}

	return nil
}
