package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/thanunbenz/su-booking-room/internal/utils"
)

const (
	RoleAdmin   = 1
	RoleTeacher = 2
	RoleVisitor = 3
)

func AdminOnly(c *fiber.Ctx) error {
	roleID, ok := GetRoleID(c)
	if !ok {
		return utils.UnauthorizedResponse(c, "Unauthorized: User not authenticated")
	}

	if roleID != RoleAdmin {
		return utils.ForbiddenResponse(c, "Forbidden: Admin access required")
	}

	return c.Next()
}

func TeacherOrAdmin(c *fiber.Ctx) error {
	roleID, ok := GetRoleID(c)
	if !ok {
		return utils.UnauthorizedResponse(c, "Unauthorized: User not authenticated")
	}

	if roleID != RoleAdmin && roleID != RoleTeacher {
		return utils.ForbiddenResponse(c, "Forbidden: Teacher or Admin access required")
	}

	return c.Next()
}

func RequireRole(allowedRoles ...uint) fiber.Handler {
	return func(c *fiber.Ctx) error {
		roleID, ok := GetRoleID(c)
		if !ok {
			return utils.UnauthorizedResponse(c, "Unauthorized: User not authenticated")
		}

		for _, allowedRole := range allowedRoles {
			if roleID == allowedRole {
				return c.Next()
			}
		}

		return utils.ForbiddenResponse(c, "Forbidden: Insufficient permissions")
	}
}
