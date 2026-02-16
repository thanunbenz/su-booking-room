package handlers

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/thanunbenz/su-booking-room/internal/models"
	"github.com/thanunbenz/su-booking-room/internal/utils"
	"gorm.io/gorm"
)

// RoleHandler - Handler สำหรับจัดการ Roles
type RoleHandler struct {
	DB *gorm.DB
}

func NewRoleHandler(db *gorm.DB) *RoleHandler {
	return &RoleHandler{DB: db}
}

// GetAll - GET /roles (ดู roles ทั้งหมด)
func (h *RoleHandler) GetAll(c *fiber.Ctx) error {
	var roles []models.Role

	if err := h.DB.Order("role_id ASC").Find(&roles).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, roles, "Success")
}

// GetByID - GET /roles/:id
func (h *RoleHandler) GetByID(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	var role models.Role
	if err := h.DB.First(&role, "role_id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Role not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, role, "Success")
}

// Create - POST /roles (Admin only - สร้าง role ใหม่)
func (h *RoleHandler) Create(c *fiber.Ctx) error {
	var input models.Role

	// Parse body
	if err := c.BodyParser(&input); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}

	// Validate struct
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

	// ตรวจสอบว่า role_name ซ้ำหรือไม่
	var existingRole models.Role
	if err := h.DB.Where("role_name = ?", input.RoleName).First(&existingRole).Error; err == nil {
		return utils.ConflictResponse(c, "Role name already exists")
	}

	// Set timestamps
	input.CreatedAt = time.Now()

	// บันทึก
	if err := h.DB.Create(&input).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusCreated, input, "Role created successfully")
}

// Update - PUT /roles/:id (Admin only)
func (h *RoleHandler) Update(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	// หา role
	var role models.Role
	if err := h.DB.First(&role, "role_id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Role not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// Parse body
	var input struct {
		RoleName    string `json:"role_name"`
		Description string `json:"description"`
	}
	if err := c.BodyParser(&input); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}

	// ตรวจสอบว่า role_name ซ้ำหรือไม่ (ยกเว้นตัวเอง)
	if input.RoleName != "" && input.RoleName != role.RoleName {
		var existingRole models.Role
		if err := h.DB.Where("role_name = ? AND role_id != ?", input.RoleName, id).First(&existingRole).Error; err == nil {
			return utils.ConflictResponse(c, "Role name already exists")
		}
		role.RoleName = input.RoleName
	}

	// Update fields
	if input.Description != "" {
		role.Description = input.Description
	}

	// บันทึก
	if err := h.DB.Save(&role).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, role, "Role updated successfully")
}

// Delete - DELETE /roles/:id (Admin only)
func (h *RoleHandler) Delete(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))

	// หา role
	var role models.Role
	if err := h.DB.First(&role, "role_id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "Role not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// ตรวจสอบว่ามี users ที่ใช้ role นี้หรือไม่
	var userCount int64
	h.DB.Model(&models.User{}).Where("role_id = ?", id).Count(&userCount)
	if userCount > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "ROLE_IN_USE",
				"message": "Cannot delete role that is assigned to users",
			},
		})
	}

	// ลบ
	if err := h.DB.Delete(&role).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, nil, "Role deleted successfully")
}
