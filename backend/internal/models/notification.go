package models

import "time"

// Notification type: booking_created, booking_approved, booking_rejected, booking_cancelled, booking_reminder
type Notification struct {
	NotificationID int       `gorm:"primaryKey;autoIncrement" json:"notification_id"`
	UserID         int       `gorm:"not null;index:idx_user_read" json:"user_id"`
	BookingID      int       `gorm:"not null;index" json:"booking_id"`
	Type           string    `gorm:"type:varchar(50);not null" json:"type"`
	Message        string    `gorm:"type:text;not null" json:"message"`
	IsRead         bool      `gorm:"default:false;index:idx_user_read" json:"is_read"`
	CreatedAt      time.Time `gorm:"default:now()" json:"created_at"`
}

func (Notification) TableName() string {
	return "notifications"
}
