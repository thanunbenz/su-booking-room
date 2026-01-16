package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/thanunbenz/su-booking-room/internal/utils"
)

func ErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}

	message := "Internal Server Error"
	errorCode := "INTERNAL_SERVER_ERROR"

	switch code {
	case fiber.StatusBadRequest:
		message = "Bad Request"
		errorCode = "BAD_REQUEST"
	case fiber.StatusUnauthorized:
		message = "Unauthorized"
		errorCode = "UNAUTHORIZED"
	case fiber.StatusForbidden:
		message = "Forbidden"
		errorCode = "FORBIDDEN"
	case fiber.StatusNotFound:
		message = "Not Found"
		errorCode = "NOT_FOUND"
	case fiber.StatusConflict:
		message = "Conflict"
		errorCode = "CONFLICT"
	case fiber.StatusUnprocessableEntity:
		message = "Unprocessable Entity"
		errorCode = "UNPROCESSABLE_ENTITY"
	}

	// ส่ง error response
	return c.Status(code).JSON(utils.ErrorResponse{
		Success: false,
		Error: utils.ErrorData{
			Code:    errorCode,
			Message: message,
			Details: nil,
		},
	})
}

func RecoverMiddleware(c *fiber.Ctx) error {
	defer func() {
		if r := recover(); r != nil {
			utils.InternalServerErrorResponse(c, "An unexpected error occurred")
		}
	}()

	return c.Next()
}
