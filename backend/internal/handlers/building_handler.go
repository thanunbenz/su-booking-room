package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/thanunbenz/su-booking-room/internal/models"
	"github.com/thanunbenz/su-booking-room/internal/utils"
	"gorm.io/gorm"
)

// BuildingHandler - MVC style handler (เหมือน Express.js)
type BuildingHandler struct {
	DB *gorm.DB
}

func NewBuildingHandler(db *gorm.DB) *BuildingHandler {
	return &BuildingHandler{DB: db}
}

// GetAll - GET /buildings
func (h *BuildingHandler) GetAll(c *fiber.Ctx) error {
	var buildings []models.Building

	if err := h.DB.Find(&buildings).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, buildings, "Success")
}

func (h *BuildingHandler) GetNameByID(c *fiber.Ctx) error {
	name := c.Params("id")

	var building models.Building
	if err := h.DB.First(&building, "building_id = ?", name).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Building not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, building, "Success")
}

// GetByID - GET /buildings/:id
func (h *BuildingHandler) GetByID(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	var building models.Building
	if err := h.DB.First(&building, "building_id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Building not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, building, "Success")
}

// Create - POST /buildings
func (h *BuildingHandler) Create(c *fiber.Ctx) error {
	var building models.Building

	// Parse body
	if err := c.BodyParser(&building); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}

	// Validate
	if building.Name == "" {
		return utils.BadRequestResponse(c, "Name is required")
	}

	// ตรวจสอบชื่อซ้ำ
	var count int64
	h.DB.Model(&models.Building{}).Where("name = ?", building.Name).Count(&count)
	if count > 0 {
		return utils.ConflictResponse(c, "Building name already exists")
	}

	// บันทึก
	if err := h.DB.Create(&building).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusCreated, building, "Building created successfully")
}

// Update - PUT /buildings/:id
func (h *BuildingHandler) Update(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	// หา building
	var building models.Building
	if err := h.DB.First(&building, "building_id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Building not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// Parse body
	var input models.Building
	if err := c.BodyParser(&input); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}

	// Update fields
	building.Name = input.Name
	building.Description = input.Description

	// Save
	if err := h.DB.Save(&building).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, building, "Building updated successfully")
}

// Delete - DELETE /buildings/:id
// ลบ building พร้อมทั้ง rooms, bookings และ fixed_schedules ที่เกี่ยวข้องทั้งหมด (cascade delete)
func (h *BuildingHandler) Delete(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	// ตรวจสอบว่า building มีอยู่จริงหรือไม่
	var building models.Building
	if err := h.DB.First(&building, "building_id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Building not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// ใช้ transaction เพื่อความปลอดภัย - ถ้า error ระหว่างทางจะ rollback ทั้งหมด
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		// Step 1: หา rooms ทั้งหมดในตึกนี้
		var rooms []models.Room
		if err := tx.Where("building_id = ?", id).Find(&rooms).Error; err != nil {
			return err
		}

		// Step 2: ลบข้อมูลที่เกี่ยวข้องกับ rooms (bookings และ fixed_schedules)
		if len(rooms) > 0 {
			roomIDs := make([]int, len(rooms))
			for i, room := range rooms {
				roomIDs[i] = room.RoomID
			}

			// ลบ bookings ที่มี room_id ในรายการนี้
			if err := tx.Where("room_id IN ?", roomIDs).Delete(&models.Booking{}).Error; err != nil {
				return err
			}

			// ลบ fixed_schedules ที่มี room_id ในรายการนี้
			if err := tx.Where("room_id IN ?", roomIDs).Delete(&models.FixedSchedule{}).Error; err != nil {
				return err
			}
		}

		// Step 3: ลบ rooms ทั้งหมดในตึกนี้
		if err := tx.Where("building_id = ?", id).Delete(&models.Room{}).Error; err != nil {
			return err
		}

		// Step 4: ลบ building
		if err := tx.Delete(&building).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, nil, "Building and all related rooms, bookings, and schedules deleted successfully")
}
