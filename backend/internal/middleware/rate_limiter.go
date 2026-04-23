package middleware

import (
	"fmt"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/thanunbenz/su-booking-room/internal/utils"
)

// RateLimiter - จำกัดจำนวน requests ต่อ user
type RateLimiter struct {
	mu       sync.RWMutex
	visitors map[uint]*Visitor
	limit    int           // จำนวน requests ที่อนุญาต
	window   time.Duration // ช่วงเวลา (เช่น 1 ชั่วโมง)
}

// Visitor - เก็บข้อมูลการเข้าใช้งานของ user
type Visitor struct {
	requests  []time.Time
	lastClean time.Time
}

var (
	bookingLimiter *RateLimiter
	pdfLimiter     *RateLimiter
	bookingOnce    sync.Once
	pdfOnce        sync.Once
)

// InitRateLimiter - สร้าง rate limiter instance สำหรับการสร้างการจอง
func InitRateLimiter(limit int, window time.Duration) {
	bookingOnce.Do(func() {
		bookingLimiter = &RateLimiter{
			visitors: make(map[uint]*Visitor),
			limit:    limit,
			window:   window,
		}
		// Clean up old visitors ทุก 10 นาที
		go bookingLimiter.cleanup()
	})
}

// InitPDFRateLimiter - สร้าง rate limiter instance สำหรับการดาวน์โหลด PDF
func InitPDFRateLimiter(limit int, window time.Duration) {
	pdfOnce.Do(func() {
		pdfLimiter = &RateLimiter{
			visitors: make(map[uint]*Visitor),
			limit:    limit,
			window:   window,
		}
		go pdfLimiter.cleanup()
	})
}

// BookingRateLimiter - middleware สำหรับจำกัดการสร้างการจอง
func BookingRateLimiter(c *fiber.Ctx) error {
	if bookingLimiter == nil {
		// ถ้ายังไม่ init ให้ผ่านไปก่อน (สำหรับ testing)
		return c.Next()
	}

	userID := c.Locals("user_id").(uint)

	if !bookingLimiter.Allow(userID) {
		return utils.StandardResponse(c, fiber.StatusTooManyRequests, nil,
			fmt.Sprintf("Rate limit exceeded. Maximum %d bookings per %v",
				bookingLimiter.limit,
				bookingLimiter.window))
	}

	return c.Next()
}

// PDFRateLimiter - middleware สำหรับจำกัดการดาวน์โหลด PDF
// (PDF generation เป็น CPU-bound จึงต้องจำกัด)
func PDFRateLimiter(c *fiber.Ctx) error {
	if pdfLimiter == nil {
		return c.Next()
	}

	userID := c.Locals("user_id").(uint)

	if !pdfLimiter.Allow(userID) {
		return utils.StandardResponse(c, fiber.StatusTooManyRequests, nil,
			fmt.Sprintf("พิมพ์ PDF บ่อยเกินไป (สูงสุด %d ครั้งต่อ %v)",
				pdfLimiter.limit,
				pdfLimiter.window))
	}

	return c.Next()
}

// Allow - ตรวจสอบว่า user สามารถทำ request ได้หรือไม่
func (rl *RateLimiter) Allow(userID uint) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	visitor, exists := rl.visitors[userID]

	if !exists {
		rl.visitors[userID] = &Visitor{
			requests:  []time.Time{now},
			lastClean: now,
		}
		return true
	}

	// ลบ requests ที่เก่าเกินกว่า window
	cutoff := now.Add(-rl.window)
	validRequests := []time.Time{}
	for _, t := range visitor.requests {
		if t.After(cutoff) {
			validRequests = append(validRequests, t)
		}
	}

	// ตรวจสอบว่าเกิน limit หรือไม่
	if len(validRequests) >= rl.limit {
		return false
	}

	// เพิ่ม request ใหม่
	validRequests = append(validRequests, now)
	visitor.requests = validRequests
	visitor.lastClean = now

	return true
}

// cleanup - ลบ visitors ที่ไม่ได้ใช้งานนานแล้ว
func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(10 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		for userID, visitor := range rl.visitors {
			// ลบ visitor ที่ไม่ได้ใช้งานมากกว่า 1 ชั่วโมง
			if now.Sub(visitor.lastClean) > time.Hour {
				delete(rl.visitors, userID)
			}
		}
		rl.mu.Unlock()
	}
}

// GetStats - ดูสถิติการใช้งาน (สำหรับ monitoring)
func (rl *RateLimiter) GetStats() map[string]interface{} {
	rl.mu.RLock()
	defer rl.mu.RUnlock()

	return map[string]interface{}{
		"active_users": len(rl.visitors),
		"limit":        rl.limit,
		"window":       rl.window.String(),
	}
}
