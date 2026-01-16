package middleware

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func LoggerMiddleware() fiber.Handler {
	return logger.New(logger.Config{
		Format:     "[${time}] ${status} - ${method} ${path} - ${latency}\n",
		TimeFormat: "2006-01-02 15:04:05",
		TimeZone:   "Asia/Bangkok",
	})
}

func CustomLogger() fiber.Handler {
	return logger.New(logger.Config{
		Format: "[${time}] ${ip} | ${status} | ${latency} | ${method} | ${path} | ${error}\n",
		CustomTags: map[string]logger.LogFunc{
			"error": func(output logger.Buffer, c *fiber.Ctx, data *logger.Data, extraParam string) (int, error) {
				if c.Response().StatusCode() >= 400 {
					return output.WriteString(string(c.Response().Body()))
				}
				return 0, nil
			},
		},
		TimeFormat: "2006-01-02 15:04:05",
		TimeZone:   "Asia/Bangkok",
	})
}

func RequestLogger(c *fiber.Ctx) error {
	start := time.Now()

	userID, hasUser := GetUserID(c)
	if hasUser {
		c.Set("X-User-ID", string(rune(userID)))
	}

	err := c.Next()

	latency := time.Since(start)
	status := c.Response().StatusCode()

	_ = latency
	_ = status

	return err
}
