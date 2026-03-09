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
}

// NewNotificationHandler - สร้าง NotificationHandler instance
func NewNotificationHandler(notifService *services.NotificationService) *NotificationHandler {
	return &NotificationHandler{
		NotifService: notifService,
	}
}

// GetMyNotifications - GET /notifications/my (ดู notifications ของตัวเอง)
func (h *NotificationHandler) GetMyNotifications(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	// Query parameters
	limitStr := c.Query("limit", "50")
	unreadOnlyStr := c.Query("unread_only", "false")

	limit, _ := strconv.Atoi(limitStr)
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
	notificationID, _ := strconv.Atoi(c.Params("id"))
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
	notificationID, _ := strconv.Atoi(c.Params("id"))
	userID := c.Locals("user_id").(uint)

	if err := h.NotifService.DeleteNotification(notificationID, int(userID)); err != nil {
		if err.Error() == "notification not found or access denied" {
			return utils.NotFoundResponse(c, "Notification not found")
		}
		return utils.InternalServerErrorResponse(c, err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, nil, "Notification deleted successfully")
}
