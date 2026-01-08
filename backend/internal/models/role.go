package models

import "time"

// Role - admin, teacher, visitor
type Role struct {
	RoleID      int       `gorm:"primaryKey;autoIncrement" json:"role_id"`
	RoleName    string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"role_name"`
	Description string    `gorm:"type:text" json:"description"`
	CreatedAt   time.Time `gorm:"default:now()" json:"created_at"`
}

func (Role) TableName() string {
	return "roles"
}
