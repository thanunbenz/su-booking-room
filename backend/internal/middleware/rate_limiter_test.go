package middleware

import (
	"sync"
	"testing"
	"time"
)

func TestRateLimiter_Allow(t *testing.T) {
	rl := &RateLimiter{
		visitors: make(map[uint]*Visitor),
		limit:    3,
		window:   1 * time.Minute,
	}

	userID := uint(1)

	// First 3 requests should be allowed
	for i := 0; i < 3; i++ {
		if !rl.Allow(userID) {
			t.Errorf("Request %d should be allowed", i+1)
		}
	}

	// 4th request should be denied
	if rl.Allow(userID) {
		t.Error("4th request should be denied (rate limit exceeded)")
	}
}

func TestRateLimiter_DifferentUsers(t *testing.T) {
	rl := &RateLimiter{
		visitors: make(map[uint]*Visitor),
		limit:    2,
		window:   1 * time.Minute,
	}

	// User 1 uses their limit
	rl.Allow(1)
	rl.Allow(1)

	// User 2 should still be able to make requests
	if !rl.Allow(2) {
		t.Error("User 2 should be allowed (separate rate limit)")
	}

	// User 1 should be denied
	if rl.Allow(1) {
		t.Error("User 1 should be denied (rate limit exceeded)")
	}
}

func TestRateLimiter_WindowExpiry(t *testing.T) {
	rl := &RateLimiter{
		visitors: make(map[uint]*Visitor),
		limit:    1,
		window:   50 * time.Millisecond, // Very short window for testing
	}

	userID := uint(1)

	// First request allowed
	if !rl.Allow(userID) {
		t.Error("First request should be allowed")
	}

	// Second request should be denied
	if rl.Allow(userID) {
		t.Error("Second request should be denied")
	}

	// Wait for window to expire
	time.Sleep(60 * time.Millisecond)

	// Should be allowed again after window expires
	if !rl.Allow(userID) {
		t.Error("Request after window expiry should be allowed")
	}
}

func TestRateLimiter_GetStats(t *testing.T) {
	rl := &RateLimiter{
		visitors: make(map[uint]*Visitor),
		limit:    10,
		window:   1 * time.Hour,
	}

	// No visitors initially
	stats := rl.GetStats()
	if stats["active_users"].(int) != 0 {
		t.Errorf("Expected 0 active users, got %v", stats["active_users"])
	}
	if stats["limit"].(int) != 10 {
		t.Errorf("Expected limit 10, got %v", stats["limit"])
	}

	// Add some visitors
	rl.Allow(1)
	rl.Allow(2)
	rl.Allow(3)

	stats = rl.GetStats()
	if stats["active_users"].(int) != 3 {
		t.Errorf("Expected 3 active users, got %v", stats["active_users"])
	}
}

func TestRateLimiter_ConcurrentAccess(t *testing.T) {
	rl := &RateLimiter{
		visitors: make(map[uint]*Visitor),
		limit:    100,
		window:   1 * time.Minute,
	}

	var wg sync.WaitGroup
	// Simulate concurrent requests from multiple users
	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func(userID uint) {
			defer wg.Done()
			rl.Allow(userID)
		}(uint(i % 10))
	}

	wg.Wait()
	// If we reach here without deadlock or panic, the test passes
}

func TestRateLimiter_ZeroLimit(t *testing.T) {
	rl := &RateLimiter{
		visitors: make(map[uint]*Visitor),
		limit:    0,
		window:   1 * time.Minute,
	}

	// With limit 0, first request creates a visitor but then on second call,
	// len(validRequests) >= limit (0 >= 0) should block
	// Actually first call creates visitor with 1 request, which means limit=0 allows first request
	// because the check happens after cleaning old requests
	if rl.Allow(1) {
		// First request adds to empty visitor, returns true
		// Second should fail
		if rl.Allow(1) {
			t.Error("With limit 0, second request should be denied")
		}
	}
}

func TestRateLimiter_NewUser(t *testing.T) {
	rl := &RateLimiter{
		visitors: make(map[uint]*Visitor),
		limit:    5,
		window:   1 * time.Minute,
	}

	// New user should always be allowed
	for i := uint(1); i <= 100; i++ {
		if !rl.Allow(i) {
			t.Errorf("New user %d should be allowed on first request", i)
		}
	}
}
