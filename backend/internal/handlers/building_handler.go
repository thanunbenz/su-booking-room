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
func (h *BuildingHandler) Delete(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	result := h.DB.Delete(&models.Building{}, "building_id = ?", id)
	if result.Error != nil {
		return utils.InternalServerErrorResponse(c, result.Error.Error())
	}

	if result.RowsAffected == 0 {
		return utils.NotFoundResponse(c, "Building not found")
	}

	return utils.StandardResponse(c, fiber.StatusOK, nil, "Building deleted successfully")
}
