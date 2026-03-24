package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/thanunbenz/su-booking-room/internal/services"
	"github.com/thanunbenz/su-booking-room/internal/utils"
)

// NotificationHandler - Handler สำหรับจัดการ notifications
type NotificationHandler struct {
	NotifService *services.NotificationService
	EmailService *services.EmailService
}

// NewNotificationHandler - สร้าง NotificationHandler instance
func NewNotificationHandler(notifService *services.NotificationService, emailService *services.EmailService) *NotificationHandler {
	return &NotificationHandler{
		NotifService: notifService,
		EmailService: emailService,
	}
}

// GetMyNotifications - GET /notifications/my (ดู notifications ของตัวเอง)
func (h *NotificationHandler) GetMyNotifications(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	// Query parameters
	limitStr := c.Query("limit", "50")
	unreadOnlyStr := c.Query("unread_only", "false")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		return utils.BadRequestResponse(c, "Invalid ID")
	}
	unreadOnly := unreadOnlyStr == "true"

	// ดึง notifications
	notifications, err := h.NotifService.GetUserNotifications(int(userID), limit, unreadOnly)
	if err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	// นับจำนวน unread
	var unreadCount int64
	for _, notif := range notifications {
		if !notif.IsRead {
			unreadCount++
		}
	}

	return utils.StandardResponse(c, fiber.StatusOK, fiber.Map{
		"notifications": notifications,
		"total":         len(notifications),
		"unread_count":  unreadCount,
	}, "Success")
}

// MarkAsRead - PATCH /notifications/:id/read (ทำเครื่องหมายว่าอ่านแล้ว)
func (h *NotificationHandler) MarkAsRead(c *fiber.Ctx) error {
	notificationID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return utils.BadRequestResponse(c, "Invalid ID")
	}
	userID := c.Locals("user_id").(uint)

	if err := h.NotifService.MarkAsRead(notificationID, int(userID)); err != nil {
		if err.Error() == "notification not found or access denied" {
			return utils.NotFoundResponse(c, "Notification not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, nil, "Notification marked as read")
}

// MarkAllAsRead - PATCH /notifications/read-all (ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว)
func (h *NotificationHandler) MarkAllAsRead(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	if err := h.NotifService.MarkAllAsRead(int(userID)); err != nil {
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, nil, "All notifications marked as read")
}

// Delete - DELETE /notifications/:id (ลบ notification)
func (h *NotificationHandler) Delete(c *fiber.Ctx) error {
	notificationID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return utils.BadRequestResponse(c, "Invalid ID")
	}
	userID := c.Locals("user_id").(uint)

	if err := h.NotifService.DeleteNotification(notificationID, int(userID)); err != nil {
		if err.Error() == "notification not found or access denied" {
			return utils.NotFoundResponse(c, "Notification not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, nil, "Notification deleted successfully")
}

// GetSettings - GET /notifications/settings (Admin only - ดูการตั้งค่า notification/email)
func (h *NotificationHandler) GetSettings(c *fiber.Ctx) error {
	queueStatus := h.EmailService.GetQueueStatus()

	settings := fiber.Map{
		"email_service": queueStatus,
		"templates": []string{
			"booking_created",
			"booking_approved",
			"booking_rejected",
			"booking_cancelled",
			"booking_reminder",
		},
	}

	return utils.StandardResponse(c, fiber.StatusOK, settings, "Notification settings retrieved")
}

// NotifTestEmailRequest - Request body for sending test email via notification handler
type NotifTestEmailRequest struct {
	To      string `json:"to" validate:"required,email"`
	Subject string `json:"subject"`
	Message string `json:"message"`
}

// SendTestEmail - POST /notifications/test-email (Admin only - ส่ง test email)
func (h *NotificationHandler) SendTestEmail(c *fiber.Ctx) error {
	var req NotifTestEmailRequest
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
			"Details": "SMTP Configuration Test - If you receive this email, your email service is working properly.",
		},
	}

	// Send email
	if err := h.EmailService.SendEmail(emailJob); err != nil {
		return utils.InternalServerErrorResponse(c, "Failed to queue email: "+err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, fiber.Map{
		"to":      req.To,
		"subject": req.Subject,
		"status":  "queued",
	}, "Test email queued successfully")
}
