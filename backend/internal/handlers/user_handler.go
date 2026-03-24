package handlers

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/thanunbenz/su-booking-room/internal/models"
	"github.com/thanunbenz/su-booking-room/internal/utils"
	"gorm.io/gorm"
)

// UserHandler - Handler สำหรับจัดการ Users
type UserHandler struct {
	DB *gorm.DB
}

func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{DB: db}
}

// GetAll - GET /users (Admin only - ดู users ทั้งหมด)
func (h *UserHandler) GetAll(c *fiber.Ctx) error {
	var users []models.User

	query := h.DB.Preload("Role").Order("created_at DESC")

	// Filter by role_id
	if roleID := c.Query("role_id"); roleID != "" {
		query = query.Where("role_id = ?", roleID)
	}

	// Search by name or email
	if search := c.Query("search"); search != "" {
		query = query.Where("fullname LIKE ? OR email LIKE ? OR username LIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if err := query.Find(&users).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// ไม่ส่ง password กลับไป
	for i := range users {
		users[i].Password = ""
	}

	return utils.StandardResponse(c, fiber.StatusOK, users, "Success")
}

// GetByID - GET /users/:id (Admin only)
func (h *UserHandler) GetByID(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return utils.BadRequestResponse(c, "Invalid ID")
	}

	var user models.User
	if err := h.DB.Preload("Role").First(&user, "user_id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "User not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// ไม่ส่ง password กลับไป
	user.Password = ""

	return utils.StandardResponse(c, fiber.StatusOK, user, "Success")
}

// Create - POST /users (Admin only - สร้าง user ใหม่)
func (h *UserHandler) Create(c *fiber.Ctx) error {
	var input struct {
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required,min=6"`
		Fullname string `json:"fullname" validate:"required,min=3"`
		Username string `json:"username" validate:"required,min=3"`
		RoleID   int    `json:"role_id" validate:"required,gt=0"`
	}

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

	// ตรวจสอบว่า email ซ้ำหรือไม่
	var existingUser models.User
	if err := h.DB.Where("email = ?", input.Email).First(&existingUser).Error; err == nil {
		return utils.ConflictResponse(c, "Email already exists")
	}

	// ตรวจสอบว่า username ซ้ำหรือไม่
	if err := h.DB.Where("username = ?", input.Username).First(&existingUser).Error; err == nil {
		return utils.ConflictResponse(c, "Username already exists")
	}

	// ตรวจสอบว่า role_id มีอยู่จริงหรือไม่
	var role models.Role
	if err := h.DB.First(&role, "role_id = ?", input.RoleID).Error; err != nil {
		return utils.NotFoundResponse(c, "Role not found")
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(input.Password)
	if err != nil {
		return utils.InternalServerErrorResponse(c, "Failed to hash password")
	}

	// สร้าง user ใหม่
	user := models.User{
		Email:     input.Email,
		Password:  hashedPassword,
		Fullname:  input.Fullname,
		Username:  input.Username,
		RoleID:    input.RoleID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// บันทึก
	if err := h.DB.Create(&user).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// Load role
	h.DB.Preload("Role").First(&user, "user_id = ?", user.UserID)

	// ไม่ส่ง password กลับไป
	user.Password = ""

	return utils.StandardResponse(c, fiber.StatusCreated, user, "User created successfully")
}

// Update - PUT /users/:id (Admin only)
func (h *UserHandler) Update(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return utils.BadRequestResponse(c, "Invalid ID")
	}

	// หา user
	var user models.User
	if err := h.DB.First(&user, "user_id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "User not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// Parse body
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Fullname string `json:"fullname"`
		Username string `json:"username"`
		RoleID   int    `json:"role_id"`
	}
	if err := c.BodyParser(&input); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}

	// Update email (ตรวจสอบซ้ำ)
	if input.Email != "" && input.Email != user.Email {
		var existingUser models.User
		if err := h.DB.Where("email = ? AND user_id != ?", input.Email, id).First(&existingUser).Error; err == nil {
			return utils.ConflictResponse(c, "Email already exists")
		}
		user.Email = input.Email
	}

	// Update username (ตรวจสอบซ้ำ)
	if input.Username != "" && input.Username != user.Username {
		var existingUser models.User
		if err := h.DB.Where("username = ? AND user_id != ?", input.Username, id).First(&existingUser).Error; err == nil {
			return utils.ConflictResponse(c, "Username already exists")
		}
		user.Username = input.Username
	}

	// Update password (ถ้ามี)
	if input.Password != "" {
		hashedPassword, err := utils.HashPassword(input.Password)
		if err != nil {
			return utils.InternalServerErrorResponse(c, "Failed to hash password")
		}
		user.Password = hashedPassword
	}

	// Update fullname
	if input.Fullname != "" {
		user.Fullname = input.Fullname
	}

	// Update role_id (ตรวจสอบว่ามี role หรือไม่)
	if input.RoleID > 0 && input.RoleID != user.RoleID {
		var role models.Role
		if err := h.DB.First(&role, "role_id = ?", input.RoleID).Error; err != nil {
			return utils.NotFoundResponse(c, "Role not found")
		}
		user.RoleID = input.RoleID
	}

	// Update timestamp
	user.UpdatedAt = time.Now()

	// บันทึก
	if err := h.DB.Save(&user).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// Load role
	h.DB.Preload("Role").First(&user, "user_id = ?", user.UserID)

	// ไม่ส่ง password กลับไป
	user.Password = ""

	return utils.StandardResponse(c, fiber.StatusOK, user, "User updated successfully")
}

// Delete - DELETE /users/:id (Admin only)
func (h *UserHandler) Delete(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return utils.BadRequestResponse(c, "Invalid ID")
	}

	// หา user
	var user models.User
	if err := h.DB.First(&user, "user_id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "User not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// ป้องกันไม่ให้ลบตัวเอง
	currentUserID := c.Locals("user_id").(uint)
	if user.UserID == int(currentUserID) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "CANNOT_DELETE_SELF",
				"message": "Cannot delete your own account",
			},
		})
	}

	// ลบ
	if err := h.DB.Delete(&user).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, nil, "User deleted successfully")
}
