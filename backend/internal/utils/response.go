package utils

import "github.com/gofiber/fiber/v2"

// SuccessResponse โครงสร้างสำหรับ response สำเร็จ
type SuccessResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
	Message string      `json:"message"`
}

// ErrorDetail รายละเอียดของ error แต่ละรายการ
type ErrorDetail struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ErrorData โครงสร้างของ error
type ErrorData struct {
	Code    string        `json:"code"`
	Message string        `json:"message"`
	Details []ErrorDetail `json:"details,omitempty"`
}

// ErrorResponse โครงสร้างสำหรับ response ที่ผิดพลาด
type ErrorResponse struct {
	Success bool      `json:"success"`
	Error   ErrorData `json:"error"`
}

// PaginationData ข้อมูล pagination
type PaginationData struct {
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
}

// PaginatedResponse โครงสร้างสำหรับ response แบบมี pagination
type PaginatedResponse struct {
	Success    bool           `json:"success"`
	Data       interface{}    `json:"data"`
	Pagination PaginationData `json:"pagination"`
}

// StandardResponse ส่ง response สำเร็จ
func StandardResponse(c *fiber.Ctx, statusCode int, data interface{}, message string) error {
	return c.Status(statusCode).JSON(SuccessResponse{
		Success: true,
		Data:    data,
		Message: message,
	})
}

// ErrorResponseJSON ส่ง response ที่ผิดพลาด
func ErrorResponseJSON(c *fiber.Ctx, statusCode int, code string, message string, details []ErrorDetail) error {
	return c.Status(statusCode).JSON(ErrorResponse{
		Success: false,
		Error: ErrorData{
			Code:    code,
			Message: message,
			Details: details,
		},
	})
}

// PaginatedResponseJSON ส่ง response แบบมี pagination
func PaginatedResponseJSON(c *fiber.Ctx, data interface{}, page, limit, total int) error {
	totalPages := (total + limit - 1) / limit
	if totalPages < 0 {
		totalPages = 0
	}

	return c.Status(fiber.StatusOK).JSON(PaginatedResponse{
		Success: true,
		Data:    data,
		Pagination: PaginationData{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: totalPages,
		},
	})
}

// ValidationErrorResponse ส่ง response สำหรับ validation error
func ValidationErrorResponse(c *fiber.Ctx, details []ErrorDetail) error {
	return ErrorResponseJSON(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Validation failed", details)
}

// UnauthorizedResponse ส่ง response สำหรับ unauthorized
func UnauthorizedResponse(c *fiber.Ctx, message string) error {
	if message == "" {
		message = "Unauthorized"
	}
	return ErrorResponseJSON(c, fiber.StatusUnauthorized, "UNAUTHORIZED", message, nil)
}

// ForbiddenResponse ส่ง response สำหรับ forbidden
func ForbiddenResponse(c *fiber.Ctx, message string) error {
	if message == "" {
		message = "Forbidden"
	}
	return ErrorResponseJSON(c, fiber.StatusForbidden, "FORBIDDEN", message, nil)
}

// NotFoundResponse ส่ง response สำหรับ not found
func NotFoundResponse(c *fiber.Ctx, message string) error {
	if message == "" {
		message = "Resource not found"
	}
	return ErrorResponseJSON(c, fiber.StatusNotFound, "NOT_FOUND", message, nil)
}

// InternalServerErrorResponse ส่ง response สำหรับ internal server error
func InternalServerErrorResponse(c *fiber.Ctx, message string) error {
	if message == "" {
		message = "Internal server error"
	}
	return ErrorResponseJSON(c, fiber.StatusInternalServerError, "INTERNAL_SERVER_ERROR", message, nil)
}

// BadRequestResponse ส่ง response สำหรับ bad request
func BadRequestResponse(c *fiber.Ctx, message string) error {
	if message == "" {
		message = "Bad request"
	}
	return ErrorResponseJSON(c, fiber.StatusBadRequest, "BAD_REQUEST", message, nil)
}

// ConflictResponse ส่ง response สำหรับ conflict
func ConflictResponse(c *fiber.Ctx, message string) error {
	if message == "" {
		message = "Resource conflict"
	}
	return ErrorResponseJSON(c, fiber.StatusConflict, "CONFLICT", message, nil)
}
