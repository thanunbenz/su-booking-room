package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/thanunbenz/su-booking-room/internal/handlers"
	"github.com/thanunbenz/su-booking-room/internal/middleware"
	"github.com/thanunbenz/su-booking-room/internal/services"
	"gorm.io/gorm"
)

func SetupRoutes(app *fiber.App, db *gorm.DB, notifService *services.NotificationService, emailService *services.EmailService) {
	// Initialize handlers with DB connection
	authHandler := handlers.NewAuthHandler(db)
	userHandler := handlers.NewUserHandler(db)
	roleHandler := handlers.NewRoleHandler(db)
	buildingHandler := handlers.NewBuildingHandler(db)
	roomHandler := handlers.NewRoomHandler(db)
	scheduleHandler := handlers.NewFixedScheduleHandler(db)
	bookingHandler := handlers.NewBookingHandler(db, notifService)
	seedHandler := handlers.NewSeedHandler(db)
	notificationHandler := handlers.NewNotificationHandler(notifService)
	testHandler := handlers.NewTestHandler(emailService)

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

	// Booking routes - organized by specificity (specific routes before parameterized ones)
	bookings := api.Group("/bookings")
	// GET routes - ordered for proper query parameter handling
	bookings.Get("/public-calendar", bookingHandler.GetPublicCalendar)                                                   // Public - ปฏิทินการจอง (sanitized, approved only)
	bookings.Get("/my", middleware.AuthMiddleware, bookingHandler.GetMyBookings)                                         // User - ดูการจองของตัวเอง
	bookings.Get("/", middleware.AuthMiddleware, middleware.AdminOnly, bookingHandler.GetAll)                            // Admin only - ดูการจองทั้งหมด (supports ?status=, ?room_id=, ?booking_date=, ?from=, ?to=)
	bookings.Get("/:id", middleware.AuthMiddleware, bookingHandler.GetByID)                                              // User/Admin - ดูการจองตาม ID
	bookings.Get("/:id/pdf", middleware.AuthMiddleware, middleware.AdminOnly, middleware.PDFRateLimiter, bookingHandler.DownloadPDF) // Admin only - ดาวน์โหลดใบยืนยันการจองเป็น PDF (rate limited)

	// POST routes
	bookings.Post("/", middleware.AuthMiddleware, middleware.BookingRateLimiter, bookingHandler.Create)                                      // User - สร้างการจอง (with rate limiting)
	bookings.Post("/pdf/batch", middleware.AuthMiddleware, middleware.AdminOnly, middleware.PDFRateLimiter, bookingHandler.DownloadBatchPDF) // Admin only - พิมพ์ PDF หลายรายการ (rate limited)

	// PATCH routes
	bookings.Patch("/:id/status", middleware.AuthMiddleware, middleware.AdminOnly, bookingHandler.UpdateStatus) // Admin only - อนุมัติ/ปฏิเสธ

	// DELETE routes - specific paths before generic :id
	bookings.Delete("/:id/cancel", middleware.AuthMiddleware, bookingHandler.Cancel)                            // User - ยกเลิกการจอง
	bookings.Delete("/:id", middleware.AuthMiddleware, middleware.AdminOnly, bookingHandler.Delete)             // Admin only - ลบการจอง

	// User routes (Admin only)
	users := api.Group("/users")
	users.Get("/", middleware.AuthMiddleware, middleware.AdminOnly, userHandler.GetAll)       // Admin only - ดู users ทั้งหมด
	users.Get("/:id", middleware.AuthMiddleware, middleware.AdminOnly, userHandler.GetByID)   // Admin only - ดู user ตาม ID
	users.Post("/", middleware.AuthMiddleware, middleware.AdminOnly, userHandler.Create)      // Admin only - สร้าง user
	users.Put("/:id", middleware.AuthMiddleware, middleware.AdminOnly, userHandler.Update)    // Admin only - แก้ไข user
	users.Delete("/:id", middleware.AuthMiddleware, middleware.AdminOnly, userHandler.Delete) // Admin only - ลบ user

	// Role routes (Admin only)
	roles := api.Group("/roles")
	roles.Get("/", roleHandler.GetAll)                                                       // All - ดู roles ทั้งหมด (สำหรับ dropdown)
	roles.Get("/:id", middleware.AuthMiddleware, middleware.AdminOnly, roleHandler.GetByID) // Admin only - ดู role ตาม ID
	roles.Post("/", middleware.AuthMiddleware, middleware.AdminOnly, roleHandler.Create)    // Admin only - สร้าง role
	roles.Put("/:id", middleware.AuthMiddleware, middleware.AdminOnly, roleHandler.Update)  // Admin only - แก้ไข role
	roles.Delete("/:id", middleware.AuthMiddleware, middleware.AdminOnly, roleHandler.Delete) // Admin only - ลบ role

	// Notification routes (protected)
	notifications := api.Group("/notifications")
	notifications.Get("/my", middleware.AuthMiddleware, notificationHandler.GetMyNotifications)           // ดู notifications ของตัวเอง
	notifications.Patch("/read-all", middleware.AuthMiddleware, notificationHandler.MarkAllAsRead)        // ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
	notifications.Patch("/:id/read", middleware.AuthMiddleware, notificationHandler.MarkAsRead)           // ทำเครื่องหมายว่าอ่านแล้ว
	notifications.Delete("/:id", middleware.AuthMiddleware, notificationHandler.Delete)                   // ลบ notification

	// Seed routes (Admin only - for development/testing)
	seed := api.Group("/seed")
	seed.Post("/all", middleware.AuthMiddleware, middleware.AdminOnly, seedHandler.SeedAll)    // Admin only - สร้าง mock data
	seed.Delete("/clear", middleware.AuthMiddleware, middleware.AdminOnly, seedHandler.ClearAll) // Admin only - ลบข้อมูลทั้งหมด

	// Test routes (for development/testing)
	test := api.Group("/test")
	test.Post("/email", testHandler.SendTestEmail) // Test email - send test email
}


