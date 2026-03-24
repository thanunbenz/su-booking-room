package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/thanunbenz/su-booking-room/internal/services"
	"github.com/thanunbenz/su-booking-room/internal/utils"
)

// TestHandler - Handler for testing purposes
type TestHandler struct {
	EmailService *services.EmailService
}

// NewTestHandler - Create TestHandler instance
func NewTestHandler(emailService *services.EmailService) *TestHandler {
	return &TestHandler{
		EmailService: emailService,
	}
}

// TestEmailRequest - Request body for testing email
type TestEmailRequest struct {
	To      string `json:"to" validate:"required,email"`
	Subject string `json:"subject"`
	Message string `json:"message"`
}

// SendTestEmail - POST /test/email (send test email)
func (h *TestHandler) SendTestEmail(c *fiber.Ctx) error {
	var req TestEmailRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequestResponse(c, "Invalid request body")
	}

	// Validate request
	if err := utils.ValidateStruct(&req); err != nil {
		return utils.ValidationErrorResponse(c, err)
	}

	// Set defaults
	if req.Subject == "" {
		req.Subject = "Test Email from SU Booking Room"
	}
	if req.Message == "" {
		req.Message = "This is a test email to verify SMTP configuration is working correctly."
	}

	// Create email job
	emailJob := &services.EmailJob{
		To:           req.To,
		Subject:      req.Subject,
		TemplateName: "test",
		Data: map[string]interface{}{
			"Message": req.Message,
			"Details": "SMTP Configuration Test - If you receive this email, your email service is working properly!",
		},
	}

	// Send email
	if err := h.EmailService.SendEmail(emailJob); err != nil {
		return utils.InternalServerErrorResponse(c, "Failed to queue email: "+err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, fiber.Map{
		"to":      req.To,
		"subject": req.Subject,
		"status":  "Email queued successfully. Check logs for delivery status.",
	}, "Test email sent successfully")
}
