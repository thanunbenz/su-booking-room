package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/thanunbenz/su-booking-room/internal/middleware"
	"github.com/thanunbenz/su-booking-room/internal/models"
	"github.com/thanunbenz/su-booking-room/internal/utils"
	"gorm.io/gorm"
)

// AuthHandler - MVC style handler (เหมือน Express.js)
type AuthHandler struct {
	DB *gorm.DB
}

func NewAuthHandler(db *gorm.DB) *AuthHandler {
	return &AuthHandler{DB: db}
}

// LoginRequest DTO
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

// RegisterRequest DTO
type RegisterRequest struct {
	Email    string `json:"email" validate:"required,email_silpakorn"`
	Password string `json:"password" validate:"required,min=6"`
	Fullname string `json:"fullname" validate:"required,min=3"`
	Username string `json:"username" validate:"required,min=3"`
}

// Login - POST /auth/login
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest

	// Parse body
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}

	// Validate
	if errors := utils.ValidateStruct(req); errors != nil {
		return utils.ValidationErrorResponse(c, errors)
	}

	// หา user จาก email
	var user models.User
	if err := h.DB.Preload("Role").Where("email = ?", req.Email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.ErrorResponseJSON(c, fiber.StatusNotFound, "USER_NOT_FOUND", "User with this email does not exist", nil)
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// ตรวจสอบ password
	if !utils.ComparePassword(user.Password, req.Password) {
		return utils.ErrorResponseJSON(c, fiber.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid email or password", nil)
	}

	// สร้าง tokens
	accessToken, err := utils.GenerateToken(uint(user.UserID), uint(user.RoleID), user.Fullname)
	if err != nil {
		return utils.InternalServerErrorResponse(c, "Failed to generate access token")
	}

	refreshToken, err := utils.GenerateRefreshToken(uint(user.UserID), uint(user.RoleID), user.Fullname)
	if err != nil {
		return utils.InternalServerErrorResponse(c, "Failed to generate refresh token")
	}

	// Response
	response := map[string]interface{}{
		"user": map[string]interface{}{
			"id":         user.UserID,
			"email":      user.Email,
			"fullname":   user.Fullname,
			"role":       map[string]interface{}{"id": user.Role.RoleID, "name": user.Role.RoleName},
			"created_at": user.CreatedAt.Format("2006-01-02T15:04:05Z"),
		},
		"tokens": map[string]interface{}{
			"access_token":  accessToken,
			"refresh_token": refreshToken,
			"token_type":    "Bearer",
		},
	}

	return utils.StandardResponse(c, fiber.StatusOK, response, "Login successful")
}

// Register - POST /auth/register
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req RegisterRequest

	// Parse body
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}

	// Validate
	if errors := utils.ValidateStruct(req); errors != nil {
		return utils.ValidationErrorResponse(c, errors)
	}

	// ตรวจสอบ email ซ้ำ
	var count int64
	h.DB.Model(&models.User{}).Where("email = ?", req.Email).Count(&count)
	if count > 0 {
		return utils.ConflictResponse(c, "Email already exists")
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return utils.InternalServerErrorResponse(c, "Failed to hash password")
	}

	// สร้าง user ใหม่
	user := models.User{
		Email:    req.Email,
		Password: hashedPassword,
		Fullname: req.Fullname,
		Username: req.Username,
		RoleID:   3, // Default: Visitor
	}

	if err := h.DB.Create(&user).Error; err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// Load role relation
	h.DB.Preload("Role").First(&user, user.UserID)

	// Response
	response := map[string]interface{}{
		"id":         user.UserID,
		"email":      user.Email,
		"fullname":   user.Fullname,
		"role":       map[string]interface{}{"id": user.Role.RoleID, "name": user.Role.RoleName},
		"created_at": user.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}

	return utils.StandardResponse(c, fiber.StatusCreated, response, "User registered successfully")
}

// GetMe - GET /auth/me
func (h *AuthHandler) GetMe(c *fiber.Ctx) error {
	// ดึง user_id จาก middleware
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return utils.UnauthorizedResponse(c, "Unauthorized")
	}

	// ดึงข้อมูล user
	var user models.User
	if err := h.DB.Preload("Role").First(&user, "user_id = ?", userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NotFoundResponse(c, "User not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// Response
	response := map[string]interface{}{
		"id":         user.UserID,
		"email":      user.Email,
		"fullname":   user.Fullname,
		"role":       map[string]interface{}{"id": user.Role.RoleID, "name": user.Role.RoleName},
		"created_at": user.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}

	return utils.StandardResponse(c, fiber.StatusOK, response, "Success")
}
