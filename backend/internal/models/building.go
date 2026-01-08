package models

import "time"

type Building struct {
	BuildingID  int       `gorm:"primaryKey;autoIncrement" json:"building_id"`
	Name        string    `gorm:"type:varchar(255);not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	CreatedAt   time.Time `gorm:"default:now()" json:"created_at"`
}

func (Building) TableName() string {
	return "buildings"
}
