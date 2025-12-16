package routes

import (
	"github.com/thanunbenz/su-booking-room/internal/handlers"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	// API v1 group
	api := app.Group("/api/v1")

	// Health check endpoint
	api.Get("/health", handlers.CheckHealth)

}
