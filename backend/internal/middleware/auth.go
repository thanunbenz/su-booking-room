package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/thanunbenz/su-booking-room/internal/utils"
)

func AuthMiddleware(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return utils.UnauthorizedResponse(c, "Missing authorization header")
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return utils.UnauthorizedResponse(c, "Invalid authorization header format")
	}

	token := parts[1]

	claims, err := utils.ExtractClaims(token)
	if err != nil {
		return utils.UnauthorizedResponse(c, "Invalid or expired token")
	}

	c.Locals("user_id", claims.UserID)
	c.Locals("role_id", claims.RoleID)
	c.Locals("full_name", claims.FullName)

	return c.Next()
}

func OptionalAuth(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Next()
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Next()
	}

	token := parts[1]
	claims, err := utils.ExtractClaims(token)
	if err != nil {
		return c.Next()
	}

	// เก็บข้อมูล user ถ้า token ถูกต้อง
	c.Locals("user_id", claims.UserID)
	c.Locals("role_id", claims.RoleID)
	c.Locals("full_name", claims.FullName)

	return c.Next()
}

func GetUserID(c *fiber.Ctx) (uint, bool) {
	userID, ok := c.Locals("user_id").(uint)
	return userID, ok
}

func GetRoleID(c *fiber.Ctx) (uint, bool) {
	roleID, ok := c.Locals("role_id").(uint)
	return roleID, ok
}

func GetFullName(c *fiber.Ctx) (string, bool) {
	fullName, ok := c.Locals("full_name").(string)
	return fullName, ok
}
