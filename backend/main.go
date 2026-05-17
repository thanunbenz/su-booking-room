package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
	"github.com/thanunbenz/su-booking-room/internal/config"
	"github.com/thanunbenz/su-booking-room/internal/middleware"
	"github.com/thanunbenz/su-booking-room/internal/routes"
	"github.com/thanunbenz/su-booking-room/internal/seed"
	"github.com/thanunbenz/su-booking-room/internal/services"
	"github.com/thanunbenz/su-booking-room/internal/utils"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  Warning: .env file not found, using environment variables")
	}

	// Initialize validator
	utils.InitValidator()

	// Verify embedded Thai fonts for PDF generation
	if err := utils.InitPDFFonts(); err != nil {
		log.Fatalf("❌ Failed to load PDF fonts: %v", err)
	}

	// สร้าง Fiber app พร้อม error handler
	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
	})

	// เชื่อมต่อ database
	config.ConnectDB()

	// Seed database (สร้างข้อมูลเริ่มต้น)
	seed.SeedDatabase(config.DB)

	// Initialize SMTP config
	smtpConfig := config.LoadSMTPConfig()

	// Initialize email service
	emailService := services.NewEmailService(smtpConfig)
	emailService.Start() // เริ่ม email workers
	defer emailService.Stop()

	// Initialize notification service
	baseURL := getEnv("APP_BASE_URL", "http://localhost:3000")
	notificationService := services.NewNotificationService(config.DB, emailService, baseURL)

	// Initialize rate limiter (max 10 bookings per hour per user)
	// middleware.InitRateLimiter(10, 1*time.Hour)

	// Initialize PDF rate limiter (max 30 PDF downloads per minute per admin)
	middleware.InitPDFRateLimiter(30, 1*time.Minute)

	// Initialize reminder service
	reminderEnabled := getEnv("REMINDER_ENABLED", "true") == "true"
	reminderHoursBefore := 24 // default: 24 hours before
	reminderService := services.NewReminderService(config.DB, notificationService, reminderHoursBefore, reminderEnabled)
	reminderService.Start()
	defer reminderService.Stop()

	log.Println("✅ Email, Notification, and Reminder services initialized")

	// Middleware
	app.Use(recover.New())               // Recover from panics
	app.Use(middleware.LoggerMiddleware()) // Custom logger
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, PATCH, OPTIONS",
	}))

	// Setup routes
	routes.SetupRoutes(app, config.DB, notificationService, emailService)

	port := 8000
	log.Printf("🚀 Server starting on port %d", port)
	log.Printf("📡 API available at http://localhost:%d/api/v1", port)
	if err := app.Listen(fmt.Sprintf(":%d", port)); err != nil {
		log.Fatalf("❌ Failed to start server: %v", err)
	}
}

// getEnv - helper function สำหรับอ่าน environment variables
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
