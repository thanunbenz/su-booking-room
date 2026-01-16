package seed

import (
	"log"

	"github.com/thanunbenz/su-booking-room/internal/models"
	"github.com/thanunbenz/su-booking-room/internal/utils"
	"gorm.io/gorm"
)

// SeedDatabase สร้างข้อมูลเริ่มต้นในระบบ
func SeedDatabase(db *gorm.DB) {
	log.Println("🌱 Starting database seeding...")

	// Seed roles
	seedRoles(db)

	// Seed admin user
	seedAdminUser(db)

	log.Println("✅ Database seeding completed!")
}

// seedRoles สร้าง default roles
func seedRoles(db *gorm.DB) {
	roles := []models.Role{
		{RoleID: 1, RoleName: "admin", Description: "Administrator"},
		{RoleID: 2, RoleName: "teacher", Description: "Teacher"},
		{RoleID: 3, RoleName: "visitor", Description: "Visitor"},
	}

	for _, role := range roles {
		var existingRole models.Role
		if err := db.Where("role_id = ?", role.RoleID).First(&existingRole).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := db.Create(&role).Error; err != nil {
					log.Printf("⚠️  Failed to create role %s: %v", role.RoleName, err)
				} else {
					log.Printf("✓ Created role: %s", role.RoleName)
				}
			}
		} else {
			log.Printf("- Role %s already exists, skipping", role.RoleName)
		}
	}
}

// seedAdminUser สร้าง admin user ตัวแรก
func seedAdminUser(db *gorm.DB) {
	// ตรวจสอบว่ามี admin user แล้วหรือไม่
	var count int64
	db.Model(&models.User{}).Where("role_id = ?", 1).Count(&count)
	if count > 0 {
		log.Println("- Admin user already exists, skipping")
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword("admin123")
	if err != nil {
		log.Printf("⚠️  Failed to hash admin password: %v", err)
		return
	}

	// สร้าง admin user
	adminUser := models.User{
		Email:    "admin@silpakorn.edu",
		Password: hashedPassword,
		Fullname: "Admin Silpakorn",
		Username: "admin",
		RoleID:   1,
	}

	if err := db.Create(&adminUser).Error; err != nil {
		log.Printf("⚠️  Failed to create admin user: %v", err)
		return
	}

	log.Println("✓ Created admin user:")
	log.Println("  Email: admin@silpakorn.edu")
	log.Println("  Password: admin123")
	log.Println("  Role: Admin")
}
