package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/thanunbenz/su-booking-room/internal/models"
	"github.com/thanunbenz/su-booking-room/internal/utils"
	"gorm.io/gorm"
)

// SeedHandler - Handler สำหรับสร้าง mock data
type SeedHandler struct {
	DB *gorm.DB
}

func NewSeedHandler(db *gorm.DB) *SeedHandler {
	return &SeedHandler{DB: db}
}

// SeedAll - สร้าง mock data ทั้งหมด (Admin only)
func (h *SeedHandler) SeedAll(c *fiber.Ctx) error {
	// ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
	var buildingCount int64
	h.DB.Model(&models.Building{}).Count(&buildingCount)
	if buildingCount > 0 {
		return utils.BadRequestResponse(c, "Database already has data. Use /seed/clear first to reset.")
	}

	// 1. สร้าง Buildings
	buildings := []models.Building{
		{Name: "อาคาร 1", Description: "อาคารเรียนรวมคณะวิทยาศาสตร์", CreatedAt: time.Now()},
		{Name: "อาคาร 2", Description: "อาคารปฏิบัติการคอมพิวเตอร์", CreatedAt: time.Now()},
		{Name: "อาคาร 3", Description: "อาคารบริการการศึกษา", CreatedAt: time.Now()},
	}

	for i := range buildings {
		if err := h.DB.Create(&buildings[i]).Error; err != nil {
			return utils.InternalServerErrorResponse(c, "Failed to seed buildings: "+err.Error())
		}
	}

	// 2. สร้าง Rooms
	rooms := []models.Room{
		// อาคาร 1
		{BuildingID: buildings[0].BuildingID, Name: "ห้อง 101", Capacity: 40, Description: "ห้องเรียนปกติ", CreatedAt: time.Now()},
		{BuildingID: buildings[0].BuildingID, Name: "ห้อง 102", Capacity: 50, Description: "ห้องเรียนใหญ่", CreatedAt: time.Now()},
		{BuildingID: buildings[0].BuildingID, Name: "Lab 103", Capacity: 30, Description: "ห้องปฏิบัติการคอมพิวเตอร์", CreatedAt: time.Now()},
		// อาคาร 2
		{BuildingID: buildings[1].BuildingID, Name: "Lab 201", Capacity: 35, Description: "ห้องปฏิบัติการโปรแกรมมิ่ง", CreatedAt: time.Now()},
		{BuildingID: buildings[1].BuildingID, Name: "Lab 202", Capacity: 45, Description: "ห้องปฏิบัติการ AI/ML", CreatedAt: time.Now()},
		{BuildingID: buildings[1].BuildingID, Name: "ห้อง 203", Capacity: 60, Description: "ห้องบรรยายใหญ่", CreatedAt: time.Now()},
		// อาคาร 3
		{BuildingID: buildings[2].BuildingID, Name: "ห้องประชุมใหญ่", Capacity: 100, Description: "ห้องจัดสัมมนา/งานใหญ่", CreatedAt: time.Now()},
		{BuildingID: buildings[2].BuildingID, Name: "ห้องประชุม 302", Capacity: 25, Description: "ห้องประชุมเล็ก", CreatedAt: time.Now()},
	}

	for i := range rooms {
		if err := h.DB.Create(&rooms[i]).Error; err != nil {
			return utils.InternalServerErrorResponse(c, "Failed to seed rooms: "+err.Error())
		}
	}

	// 3. สร้าง Fixed Schedules (ตารางเรียนประจำ)
	schedules := []models.FixedSchedule{
		// อาคาร 1 ห้อง 101 - มีเรียนจันทร์ 09:00-12:00
		{RoomID: rooms[0].RoomID, Subject: "CS101 โครงสร้างข้อมูล", TeacherName: "อ. สมชาย ใจดี", DayOfWeek: 1, StartTime: "09:00", EndTime: "12:00", Semester: "1/2567"},
		// อาคาร 1 ห้อง 101 - มีเรียนพุธ 13:00-16:00
		{RoomID: rooms[0].RoomID, Subject: "CS102 ระบบฐานข้อมูล", TeacherName: "อ. สมหญิง รักเรียน", DayOfWeek: 3, StartTime: "13:00", EndTime: "16:00", Semester: "1/2567"},
		// อาคาร 2 Lab 201 - มีเรียนอังคาร 09:00-12:00
		{RoomID: rooms[3].RoomID, Subject: "CS201 ปัญญาประดิษฐ์", TeacherName: "อ. วิทยา คอมพิวเตอร์", DayOfWeek: 2, StartTime: "09:00", EndTime: "12:00", Semester: "1/2567"},
		// อาคาร 2 Lab 201 - มีเรียนศุกร์ 13:00-16:00
		{RoomID: rooms[3].RoomID, Subject: "CS202 Machine Learning", TeacherName: "ผศ. ดร. ปัญญา สุขใจ", DayOfWeek: 5, StartTime: "13:00", EndTime: "16:00", Semester: "1/2567"},
	}

	for i := range schedules {
		if err := h.DB.Create(&schedules[i]).Error; err != nil {
			return utils.InternalServerErrorResponse(c, "Failed to seed schedules: "+err.Error())
		}
	}

	// 4. สร้าง Users (หา user ที่มีอยู่แล้วหรือสร้างใหม่)
	var users []models.User
	if err := h.DB.Find(&users).Error; err != nil {
		return utils.InternalServerErrorResponse(c, "Failed to find users: "+err.Error())
	}

	if len(users) == 0 {
		return utils.BadRequestResponse(c, "No users found. Please register users first before seeding bookings.")
	}

	// 5. สร้าง Bookings
	today := time.Now()
	tomorrow := today.AddDate(0, 0, 1)
	nextWeek := today.AddDate(0, 0, 7)

	bookings := []models.Booking{
		// Pending bookings
		{
			UserID:      users[0].UserID,
			RoomID:      rooms[0].RoomID,
			Title:       "ประชุมโครงงาน",
			Detail:      "ประชุมเตรียมนำเสนอโครงงานครั้งที่ 1",
			BookingDate: tomorrow,
			StartTime:   "09:00",
			EndTime:     "11:00",
			Status:      "pending",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			UserID:      users[0].UserID,
			RoomID:      rooms[1].RoomID,
			Title:       "ทำงานกลุ่ม",
			Detail:      "ทำงานกลุ่มวิชา Data Science",
			BookingDate: tomorrow,
			StartTime:   "13:00",
			EndTime:     "15:00",
			Status:      "pending",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		// Approved booking
		{
			UserID:      users[0].UserID,
			RoomID:      rooms[2].RoomID,
			Title:       "Workshop Python",
			Detail:      "สอน Python พื้นฐานให้น้องๆ",
			BookingDate: nextWeek,
			StartTime:   "09:00",
			EndTime:     "12:00",
			Status:      "approved",
			StatusNote:  "อนุมัติแล้ว",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			UserID:      users[0].UserID,
			RoomID:      rooms[4].RoomID,
			Title:       "สอบกลางภาค",
			Detail:      "สอบวิชา Web Development",
			BookingDate: nextWeek,
			StartTime:   "13:00",
			EndTime:     "16:00",
			Status:      "approved",
			StatusNote:  "อนุมัติแล้ว",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		// Rejected booking
		{
			UserID:      users[0].UserID,
			RoomID:      rooms[0].RoomID,
			Title:       "ซ้อมดนตรี",
			Detail:      "ซ้อมดนตรีประกอบการแสดง",
			BookingDate: tomorrow,
			StartTime:   "16:00",
			EndTime:     "18:00",
			Status:      "rejected",
			StatusNote:  "ห้องไม่เหมาะสมสำหรับซ้อมดนตรี",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
	}

	// เพิ่ม user ที่ 2 ถ้ามี
	if len(users) > 1 {
		bookings = append(bookings, models.Booking{
			UserID:      users[1].UserID,
			RoomID:      rooms[5].RoomID,
			Title:       "สัมมนาวิจัย",
			Detail:      "นำเสนอผลงานวิจัยด้านคอมพิวเตอร์",
			BookingDate: nextWeek,
			StartTime:   "09:00",
			EndTime:     "12:00",
			Status:      "pending",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		})
	}

	for i := range bookings {
		if err := h.DB.Create(&bookings[i]).Error; err != nil {
			return utils.InternalServerErrorResponse(c, "Failed to seed bookings: "+err.Error())
		}
	}

	return utils.StandardResponse(c, fiber.StatusOK, fiber.Map{
		"buildings_created": len(buildings),
		"rooms_created":     len(rooms),
		"schedules_created": len(schedules),
		"bookings_created":  len(bookings),
	}, "Mock data seeded successfully")
}

// ClearAll - ลบข้อมูลทั้งหมด (ใช้เพื่อ reset database สำหรับทดสอบ)
func (h *SeedHandler) ClearAll(c *fiber.Ctx) error {
	// ลบข้อมูลทั้งหมด (ยกเว้น users และ roles)
	if err := h.DB.Exec("DELETE FROM bookings").Error; err != nil {
		return utils.InternalServerErrorResponse(c, "Failed to clear bookings: "+err.Error())
	}

	if err := h.DB.Exec("DELETE FROM fixed_schedules").Error; err != nil {
		return utils.InternalServerErrorResponse(c, "Failed to clear schedules: "+err.Error())
	}

	if err := h.DB.Exec("DELETE FROM rooms").Error; err != nil {
		return utils.InternalServerErrorResponse(c, "Failed to clear rooms: "+err.Error())
	}

	if err := h.DB.Exec("DELETE FROM buildings").Error; err != nil {
		return utils.InternalServerErrorResponse(c, "Failed to clear buildings: "+err.Error())
	}

	return utils.StandardResponse(c, fiber.StatusOK, nil, "All data cleared successfully (except users and roles)")
}
