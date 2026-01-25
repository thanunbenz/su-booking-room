package routes

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/thanunbenz/su-booking-room/internal/handlers"
	"github.com/thanunbenz/su-booking-room/internal/middleware"
	"gorm.io/gorm"
)

func SetupRoutes(app *fiber.App, db *gorm.DB) {
	// Initialize handlers with DB connection
	authHandler := handlers.NewAuthHandler(db)
	buildingHandler := handlers.NewBuildingHandler(db)
	roomHandler := handlers.NewRoomHandler(db)
	scheduleHandler := handlers.NewFixedScheduleHandler(db)
	bookingHandler := handlers.NewBookingHandler(db)
	seedHandler := handlers.NewSeedHandler(db)

	// API v1 group
	api := app.Group("/api/v1")

	// Health check endpoint
	api.Get("/health", handlers.CheckHealth)

	// Auth routes (public)
	auth := api.Group("/auth")
	auth.Post("/login", authHandler.Login)
	auth.Post("/register", authHandler.Register)

	// Auth routes (protected - require authentication)
	auth.Get("/me", middleware.AuthMiddleware, authHandler.GetMe)

	// Building routes (public read, admin write)
	buildings := api.Group("/buildings")
	buildings.Get("/", buildingHandler.GetAll)                                      // All
	buildings.Get("/:id", buildingHandler.GetByID)                                  // All
	buildings.Get("/:id/name", buildingHandler.GetNameByID)                                  // get name by id
	buildings.Get("/:id/rooms", roomHandler.GetByBuildingID)                        // All - ดู rooms ในตึก
	buildings.Post("/", middleware.AuthMiddleware, middleware.AdminOnly, buildingHandler.Create)   // Admin only
	buildings.Put("/:id", middleware.AuthMiddleware, middleware.AdminOnly, buildingHandler.Update) // Admin only
	buildings.Delete("/:id", middleware.AuthMiddleware, middleware.AdminOnly, buildingHandler.Delete) // Admin only

	// Room routes (public read, admin write)
	rooms := api.Group("/rooms")
	rooms.Get("/", roomHandler.GetAll)                                              // All
	rooms.Get("/:id", roomHandler.GetByID)                                          // All
	rooms.Get("/:id/schedules", scheduleHandler.GetByRoomID)                        // All - ดู schedules ของห้อง
	rooms.Get("/:id/availability", bookingHandler.GetByRoomAndDate)                 // All - ดูการจองของห้อง (สำหรับตรวจสอบความว่าง)
	rooms.Post("/", middleware.AuthMiddleware, middleware.AdminOnly, roomHandler.Create)   // Admin only
	rooms.Put("/:id", middleware.AuthMiddleware, middleware.AdminOnly, roomHandler.Update) // Admin only
	rooms.Delete("/:id", middleware.AuthMiddleware, middleware.AdminOnly, roomHandler.Delete) // Admin only

	// Fixed Schedule routes (public read, admin write)
	schedules := api.Group("/schedules")
	schedules.Get("/", scheduleHandler.GetAll)                                                    // All
	schedules.Get("/:id", scheduleHandler.GetByID)                                                // All
	schedules.Post("/", middleware.AuthMiddleware, middleware.AdminOnly, scheduleHandler.Create)         // Admin only
	schedules.Put("/:id", middleware.AuthMiddleware, middleware.AdminOnly, scheduleHandler.Update)       // Admin only
	schedules.Delete("/:id", middleware.AuthMiddleware, middleware.AdminOnly, scheduleHandler.Delete)    // Admin only
	schedules.Post("/bulk", middleware.AuthMiddleware, middleware.AdminOnly, scheduleHandler.BulkCreate) // Admin only

	// Booking routes (require authentication)
	bookings := api.Group("/bookings", middleware.AuthMiddleware)
	bookings.Get("/my", bookingHandler.GetMyBookings)                               // User - ดูการจองของตัวเอง
	bookings.Get("/:id", bookingHandler.GetByID)                                    // User/Admin - ดูการจองตาม ID
	bookings.Post("/", bookingHandler.Create)                                       // User - สร้างการจอง
	bookings.Delete("/:id/cancel", bookingHandler.Cancel)                           // User - ยกเลิกการจอง
	bookings.Get("/", middleware.AdminOnly, bookingHandler.GetAll)                  // Admin only - ดูการจองทั้งหมด
	bookings.Patch("/:id/status", middleware.AdminOnly, bookingHandler.UpdateStatus) // Admin only - อนุมัติ/ปฏิเสธ
	bookings.Delete("/:id", middleware.AdminOnly, bookingHandler.Delete)            // Admin only - ลบการจอง

	// Seed routes (Admin only - for testing)
	seed := api.Group("/seed", middleware.AuthMiddleware, middleware.AdminOnly)
	seed.Post("/all", seedHandler.SeedAll)     // สร้าง mock data ทั้งหมด
	seed.Delete("/clear", seedHandler.ClearAll) // ลบข้อมูลทั้งหมด (ยกเว้น users)

	// Log registered routes
	printRoutes(app)
}

// printRoutes แสดง routes ทั้งหมดที่ลงทะเบียนแล้ว
func printRoutes(app *fiber.App) {
	log.Println("")
	log.Println("📋 Registered Routes:")
	log.Println("==========================================")
	routes := app.GetRoutes()
	for _, route := range routes {
		if route.Method != "" && route.Path != "" {
			log.Printf("  %-6s %s", route.Method, route.Path)
		}
	}
	log.Println("==========================================")
	log.Println("")
}
