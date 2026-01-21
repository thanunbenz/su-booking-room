package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/thanunbenz/su-booking-room/internal/models"
	"github.com/thanunbenz/su-booking-room/internal/utils"
	"gorm.io/gorm"
)

type RoomHandler struct {
	DB *gorm.DB
}

func NewRoomHandler(db *gorm.DB) *RoomHandler {
	return &RoomHandler{DB: db}
}

// GetAll - GET /rooms
func (h *RoomHandler) GetAll(c *fiber.Ctx) error {
	var rooms []models.Room

	if err := h.DB.Preload("Building").Find(&rooms).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, rooms, "Success")
}

// GetByID - GET /rooms/:id
func (h *RoomHandler) GetByID(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	var room models.Room
	if err := h.DB.Preload("Building").First(&room, "room_id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Room not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, room, "Success")
}

// GetByBuildingID - GET /buildings/:id/rooms
func (h *RoomHandler) GetByBuildingID(c *fiber.Ctx) error {
	buildingID, _ := strconv.Atoi(c.Params("id"))

	// ตรวจสอบว่า building มีอยู่ไหม
	var building models.Building
	if err := h.DB.First(&building, "building_id = ?", buildingID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Building not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// ดึง rooms ในตึกนั้น
	var rooms []models.Room
	if err := h.DB.Preload("Building").Where("building_id = ?", buildingID).Find(&rooms).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, rooms, "Success")
}

// Create - POST /rooms
func (h *RoomHandler) Create(c *fiber.Ctx) error {
	var room models.Room

	// Parse body
	if err := c.BodyParser(&room); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}

	// Validate
	if room.Name == "" {
		return utils.BadRequestResponse(c, "Name is required")
	}
	if room.BuildingID == 0 {
		return utils.BadRequestResponse(c, "Building ID is required")
	}

	// ตรวจสอบว่า building มีอยู่ไหม
	var building models.Building
	if err := h.DB.First(&building, "building_id = ?", room.BuildingID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Building not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// ตรวจสอบชื่อซ้ำในตึกเดียวกัน
	var count int64
	h.DB.Model(&models.Room{}).Where("building_id = ? AND name = ?", room.BuildingID, room.Name).Count(&count)
	if count > 0 {
		return utils.ConflictResponse(c, "Room name already exists in this building")
	}

	// บันทึก
	if err := h.DB.Create(&room).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// Load relation
	h.DB.Preload("Building").First(&room, room.RoomID)

	return utils.StandardResponse(c, fiber.StatusCreated, room, "Room created successfully")
}

// Update - PUT /rooms/:id
func (h *RoomHandler) Update(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	// หา room
	var room models.Room
	if err := h.DB.First(&room, "room_id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Room not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// Parse body
	var input models.Room
	if err := c.BodyParser(&input); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}

	// ตรวจสอบว่า building มีอยู่ไหม (ถ้ามีการเปลี่ยน)
	if input.BuildingID != 0 && input.BuildingID != room.BuildingID {
		var building models.Building
		if err := h.DB.First(&building, "building_id = ?", input.BuildingID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return utils.NotFoundResponse(c, "Building not found")
			}
			return utils.InternalServerErrorResponse(c, err.Error())
		}
	}

	buildingIDToCheck := room.BuildingID
	if input.BuildingID != 0 {
		buildingIDToCheck = input.BuildingID
	}

	if input.Name != "" && input.Name != room.Name {
		var count int64
		h.DB.Model(&models.Room{}).
			Where("building_id = ? AND name = ? AND room_id != ?", buildingIDToCheck, input.Name, id).
			Count(&count)
		if count > 0 {
			return utils.ConflictResponse(c, "Room name already exists in this building")
		}
	}

	// Update fields
	if input.Name != "" {
		room.Name = input.Name
	}
	if input.BuildingID != 0 {
		room.BuildingID = input.BuildingID
	}
	if input.Capacity != 0 {
		room.Capacity = input.Capacity
	}
	if input.Description != "" {
		room.Description = input.Description
	}

	// Save
	if err := h.DB.Save(&room).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// Load relation
	h.DB.Preload("Building").First(&room, room.RoomID)

	return utils.StandardResponse(c, fiber.StatusOK, room, "Room updated successfully")
}

// Delete - DELETE /rooms/:id
func (h *RoomHandler) Delete(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	result := h.DB.Delete(&models.Room{}, "room_id = ?", id)
	if result.Error != nil {
		return utils.InternalServerErrorResponse(c, result.Error.Error())
	}

	if result.RowsAffected == 0 {
		return utils.NotFoundResponse(c, "Room not found")
	}

	return utils.StandardResponse(c, fiber.StatusOK, nil, "Room deleted successfully")
}
