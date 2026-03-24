package models

import "time"

// BookingGroup groups multiple bookings together for multi-room booking
type BookingGroup struct {
	GroupID   int       `gorm:"primaryKey;autoIncrement" json:"group_id"`
	UserID    int       `gorm:"not null;index" json:"user_id"`
	Title     string    `gorm:"type:varchar(255);not null" json:"title"`
	CreatedAt time.Time `gorm:"default:now()" json:"created_at"`

	// Relations
	User     User      `gorm:"foreignKey:UserID;references:UserID" json:"user,omitempty"`
	Bookings []Booking `gorm:"foreignKey:GroupID;references:GroupID" json:"bookings,omitempty"`
}

func (BookingGroup) TableName() string {
	return "booking_groups"
}
