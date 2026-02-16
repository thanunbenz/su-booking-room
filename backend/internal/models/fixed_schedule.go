package models

// FixedSchedule - ตารางการจอง
type FixedSchedule struct {
	ScheduleID  int    `gorm:"primaryKey;autoIncrement" json:"schedule_id"`
	RoomID      int    `gorm:"not null;index:idx_room_day_time" json:"room_id"`
	Subject     string `gorm:"type:varchar(255);not null" json:"subject"`
	TeacherName string `gorm:"type:varchar(255)" json:"teacher_name"`
	DayOfWeek   int    `gorm:"not null;index:idx_room_day_time" json:"day_of_week"` // 1=Mon, 2=Tue, ..., 7=Sun
	StartTime   string `gorm:"type:varchar(8);not null;index:idx_room_day_time" json:"start_time"` // HH:MM or HH:MM:SS
	EndTime     string `gorm:"type:varchar(8);not null" json:"end_time"` // HH:MM or HH:MM:SS
	Semester    string `gorm:"type:varchar(20)" json:"semester"` // เช่น 1/2567
}

func (FixedSchedule) TableName() string {
	return "fixed_schedules"
}
