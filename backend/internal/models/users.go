package models

import "time"

type User struct {
	UserID    int       `gorm:"primaryKey;autoIncrement" json:"user_id"`
	RoleID    int       `gorm:"not null;index" json:"role_id"`
	Fullname  string    `gorm:"type:varchar(255);not null" json:"fullname"`
	Email     string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	Username  string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"username"`
	Password  string    `gorm:"type:varchar(255);not null" json:"-"` // ไม่ส่งกลับใน JSON
	CreatedAt time.Time `gorm:"default:now()" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:now()" json:"updated_at"`

	// Relation
	Role Role `gorm:"foreignKey:RoleID;references:RoleID" json:"role"`
}

func (User) TableName() string {
	return "users"
}
