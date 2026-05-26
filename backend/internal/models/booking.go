package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"

	"gorm.io/gorm"
)

// CustomDate is a custom type for handling date-only strings in JSON
type CustomDate struct {
	time.Time
}

// UnmarshalJSON implements custom JSON unmarshaling for date strings
func (cd *CustomDate) UnmarshalJSON(b []byte) error {
	// Remove quotes from JSON string
	s := string(b)
	if s == "null" || s == `""` {
		cd.Time = time.Time{}
		return nil
	}

	// Remove surrounding quotes
	s = s[1 : len(s)-1]

	// Parse date in YYYY-MM-DD format
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return err
	}
	cd.Time = t
	return nil
}

// MarshalJSON implements custom JSON marshaling
func (cd CustomDate) MarshalJSON() ([]byte, error) {
	if cd.Time.IsZero() {
		return []byte("null"), nil
	}
	return json.Marshal(cd.Time.Format("2006-01-02"))
}

// Value implements driver.Valuer interface for database storage
func (cd CustomDate) Value() (driver.Value, error) {
	if cd.Time.IsZero() {
		return nil, nil
	}
	return cd.Time.Format("2006-01-02"), nil
}

// Scan implements sql.Scanner interface for database retrieval
func (cd *CustomDate) Scan(value interface{}) error {
	if value == nil {
		cd.Time = time.Time{}
		return nil
	}

	switch v := value.(type) {
	case time.Time:
		cd.Time = v
		return nil
	case []byte:
		t, err := time.Parse("2006-01-02", string(v))
		if err != nil {
			return err
		}
		cd.Time = t
		return nil
	case string:
		t, err := time.Parse("2006-01-02", v)
		if err != nil {
			return err
		}
		cd.Time = t
		return nil
	default:
		return fmt.Errorf("cannot scan type %T into CustomDate", value)
	}
}

// Booking status: pending, approved, rejected, cancelled, completed, pending_cancellation
type Booking struct {
	BookingID        int        `gorm:"primaryKey;autoIncrement" json:"booking_id"`
	UserID           int        `gorm:"not null;index" json:"user_id"`
	RoomID           int        `gorm:"not null;index:idx_room_date_time" json:"room_id" validate:"required,gt=0"`
	Title            string     `gorm:"type:varchar(255);not null" json:"title" validate:"required,min=1,max=255"`
	Detail           string     `gorm:"type:text" json:"detail" validate:"omitempty,max=5000"`
	EquipmentRequest string     `gorm:"type:text" json:"equipment_request" validate:"omitempty,max=5000"` // เช่น: คอมพิวเตอร์ 20 เครื่อง, โปรเจคเตอร์ 1 เครื่อง
	BookingDate      CustomDate `gorm:"type:date;not null;index:idx_room_date_time" json:"booking_date" validate:"required"` // วันที่เริ่มจอง
	EndDate          CustomDate `gorm:"type:date;not null;index" json:"end_date" validate:"required"`                        // วันสิ้นสุด (inclusive); จองวันเดียวให้เท่ากับ booking_date
	StartTime        string     `gorm:"type:time;not null;index:idx_room_date_time" json:"start_time" validate:"required"`   // เวลาเริ่ม (ใช้กับทุกวันในช่วง)
	EndTime          string     `gorm:"type:time;not null" json:"end_time" validate:"required"`                              // เวลาสิ้นสุด (ใช้กับทุกวันในช่วง)
	Status           string     `gorm:"type:varchar(30);not null;default:'approved';index" json:"status" validate:"omitempty,oneof=pending approved rejected cancelled completed pending_cancellation"`
	StatusNote       string     `gorm:"type:text" json:"status_note" validate:"omitempty,max=1000"` // เหตุผลการยกเลิก/ปฏิเสธ หรือหมายเหตุอื่นๆ
	PreviousStatus   string     `gorm:"type:varchar(30)" json:"previous_status,omitempty"`          // สถานะก่อนขอยกเลิก (ใช้เมื่อ reject คำขอยกเลิก)
	CancellationRequestedAt *time.Time `gorm:"index" json:"cancellation_requested_at,omitempty"`
	CancellationRequestedBy *int       `gorm:"index" json:"cancellation_requested_by,omitempty"` // admin user_id
	CreatedAt        time.Time  `gorm:"default:now()" json:"created_at"`
	UpdatedAt        time.Time  `gorm:"default:now()" json:"updated_at"`

	// Relations
	User User `gorm:"foreignKey:UserID;references:UserID" json:"user"`
	Room Room `gorm:"foreignKey:RoomID;references:RoomID" json:"room"`
}

func (Booking) TableName() string {
	return "bookings"
}

// BookingStatusesOccupyingRoom — การจองที่ยังถือสิทธิ์ใช้ห้อง (รวมรอยืนยันยกเลิก)
var BookingStatusesOccupyingRoom = []string{"pending", "approved", "pending_cancellation"}

// Validation: ตรวจสอบว่า status ถูกต้อง
func (b *Booking) BeforeSave(tx *gorm.DB) error {
	validStatuses := map[string]bool{
		"pending":                true,
		"approved":               true,
		"rejected":               true,
		"cancelled":              true,
		"completed":              true,
		"pending_cancellation":   true,
	}
	if !validStatuses[b.Status] {
		return gorm.ErrInvalidData
	}
	return nil
}

// ClearCancellationRequest resets admin cancellation request metadata.
func (b *Booking) ClearCancellationRequest() {
	b.PreviousStatus = ""
	b.CancellationRequestedAt = nil
	b.CancellationRequestedBy = nil
}
