package models

import "time"

type Room struct {
	RoomID      int       `gorm:"primaryKey;autoIncrement" json:"room_id"`
	BuildingID  int       `gorm:"not null;index" json:"building_id"`
	Name        string    `gorm:"type:varchar(255);not null" json:"name"`
	Capacity    int       `gorm:"default:0" json:"capacity"`
	Description string    `gorm:"type:text" json:"description"`
	CreatedAt   time.Time `gorm:"default:now()" json:"created_at"`

	// Relation
	Building Building `gorm:"foreignKey:BuildingID;references:BuildingID" json:"building"`
}

func (Room) TableName() string {
	return "rooms"
}
