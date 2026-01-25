package models

import (
	"time"

	"gorm.io/gorm"
)

// Booking status: pending, approved, rejected, cancelled, completed
type Booking struct {
	BookingID        int       `gorm:"primaryKey;autoIncrement" json:"booking_id"`
	UserID           int       `gorm:"not null;index" json:"user_id"`
	RoomID           int       `gorm:"not null;index:idx_room_date_time" json:"room_id"`
	Title            string    `gorm:"type:varchar(255);not null" json:"title"`
	Detail           string    `gorm:"type:text" json:"detail"`
	EquipmentRequest string    `gorm:"type:text" json:"equipment_request"` // เช่น: คอมพิวเตอร์ 20 เครื่อง, โปรเจคเตอร์ 1 เครื่อง
	BookingDate      time.Time `gorm:"type:date;not null;index:idx_room_date_time" json:"booking_date"`
	StartTime        string    `gorm:"type:time;not null;index:idx_room_date_time" json:"start_time"`
	EndTime          string    `gorm:"type:time;not null" json:"end_time"`
	Status           string    `gorm:"type:varchar(20);not null;default:'approved';index" json:"status"`
	StatusNote       string    `gorm:"type:text" json:"status_note"` // เหตุผลการยกเลิก/ปฏิเสธ หรือหมายเหตุอื่นๆ
	CreatedAt        time.Time `gorm:"default:now()" json:"created_at"`
	UpdatedAt        time.Time `gorm:"default:now()" json:"updated_at"`
}

func (Booking) TableName() string {
	return "bookings"
}

// Validation: ตรวจสอบว่า status ถูกต้อง
func (b *Booking) BeforeSave(tx *gorm.DB) error {
	validStatuses := map[string]bool{
		"pending":   true,
		"approved":  true,
		"rejected":  true,
		"cancelled": true,
		"completed": true,
	}
	if !validStatuses[b.Status] {
		return gorm.ErrInvalidData
	}
	return nil
}
