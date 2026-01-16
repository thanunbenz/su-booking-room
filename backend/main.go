package main

import (
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/thanunbenz/su-booking-room/internal/config"
	"github.com/thanunbenz/su-booking-room/internal/middleware"
	"github.com/thanunbenz/su-booking-room/internal/routes"
	"github.com/thanunbenz/su-booking-room/internal/seed"
	"github.com/thanunbenz/su-booking-room/internal/utils"
)

func main() {
	// Initialize validator
	utils.InitValidator()

	// สร้าง Fiber app พร้อม error handler
	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
	})

	// เชื่อมต่อ database
	config.ConnectDB()

	// Seed database (สร้างข้อมูลเริ่มต้น)
	seed.SeedDatabase(config.DB)

	// Middleware
	app.Use(recover.New())               // Recover from panics
	app.Use(middleware.LoggerMiddleware()) // Custom logger
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, PATCH, OPTIONS",
	}))

	// Setup routes
	routes.SetupRoutes(app, config.DB)

	port := 8000
	log.Printf("🚀 Server starting on port %d", port)
	log.Printf("📡 API available at http://localhost:%d/api/v1", port)
	if err := app.Listen(fmt.Sprintf(":%d", port)); err != nil {
		log.Fatalf("❌ Failed to start server: %v", err)
	}
}
