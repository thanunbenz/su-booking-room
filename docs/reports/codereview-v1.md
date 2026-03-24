# Code Review Report -- SU Booking Room

**Date:** 2026-03-24
**Reviewer:** Automated Code Review Agent
**Scope:** Full codebase review (backend + frontend)

## Summary

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Bugs | 2 | 3 | 4 | 2 |
| Security | 3 | 3 | 2 | 1 |
| Performance | 0 | 2 | 3 | 1 |
| Code Quality | 0 | 1 | 5 | 4 |
| **Total** | **5** | **9** | **14** | **8** |

---

## Critical Issues

### [C-001] Hardcoded database credentials in source code
- **File:** `backend/internal/config/database.go:34`
- **Category:** Security
- **Description:** The default database password `sumbenz2806` is hardcoded as a fallback value in the `password` variable initializer. This is a real credential committed to the repository.
- **Impact:** Anyone with access to the repository can obtain database credentials. If the environment variable is not set, the application connects with these credentials.
- **Recommendation:** Remove the hardcoded password. Use an empty string as the default or fail startup if `DB_PASSWORD` is not set.

### [C-002] JWT secret falls back to empty string
- **File:** `backend/internal/utils/jwt.go:20-21`
- **Category:** Security
- **Description:** `os.Getenv("JWT_SECRET")` returns an empty string if the environment variable is not set. The JWT signing key would then be an empty byte slice, making tokens trivially forgeable.
- **Impact:** An attacker can forge arbitrary JWT tokens (including admin tokens) if `JWT_SECRET` is not configured, leading to full authentication bypass.
- **Recommendation:** Validate that `JWT_SECRET` is set and has sufficient length (minimum 32 characters) at startup. Abort if missing.

### [C-003] GET /bookings endpoint has no authentication
- **File:** `backend/internal/routes/routes.go:71`
- **Category:** Security
- **Description:** The `GET /bookings/` route does not use `middleware.AuthMiddleware` or `middleware.AdminOnly`. The comment says "Admin only" but the middleware is missing from the route definition.
- **Impact:** Any unauthenticated user can list all bookings in the system, including user details (via preloaded User.Role). This leaks personal information.
- **Recommendation:** Add `middleware.AuthMiddleware, middleware.AdminOnly` to the `GET /bookings/` route, matching the documented intent.

### [C-004] Test email endpoint has no authentication
- **File:** `backend/internal/routes/routes.go:114`
- **Category:** Security
- **Description:** The `POST /test/email` route has no authentication or admin middleware. Anyone can send emails through the server's SMTP configuration.
- **Impact:** Open email relay. An attacker can use this endpoint to send spam or phishing emails through the server, potentially getting the SMTP credentials blacklisted.
- **Recommendation:** Add `middleware.AuthMiddleware, middleware.AdminOnly` to this route, or remove it entirely from production builds.

### [C-005] Type assertion panic in BookingRateLimiter
- **File:** `backend/internal/middleware/rate_limiter.go:51`
- **Category:** Bug
- **Description:** `c.Locals("user_id").(uint)` performs an unchecked type assertion. If `user_id` is not set or is a different type, this will cause a runtime panic (nil pointer dereference / interface conversion panic).
- **Impact:** Server crash on any request that reaches the rate limiter without valid authentication data, causing denial of service.
- **Recommendation:** Use the comma-ok pattern: `userID, ok := c.Locals("user_id").(uint)` and return an error if `!ok`.

---

## High Priority Issues

### [H-001] GetByRoomAndDate uses wrong route parameter name
- **File:** `backend/internal/handlers/booking_handler.go:71`
- **Category:** Bug
- **Description:** The handler reads `c.Params("room_id")`, but the route is registered as `rooms.Get("/:id/availability", ...)` in `routes.go:53`. The parameter name is `id`, not `room_id`.
- **Impact:** `strconv.Atoi(c.Params("room_id"))` always returns 0, so room availability check always queries for room_id=0, returning no results.
- **Recommendation:** Change `c.Params("room_id")` to `c.Params("id")`.

### [H-002] Unchecked strconv.Atoi results across multiple handlers
- **File:** `backend/internal/handlers/building_handler.go:48`, `room_handler.go:33,48,114,184`, `role_handler.go:35,88,132`, `user_handler.go:52,145,228`, `booking_handler.go:108,235,295,336`
- **Category:** Bug
- **Description:** Many handlers use `id, _ := strconv.Atoi(c.Params("id"))` discarding the error. If the parameter is not a valid integer (e.g., `/buildings/abc`), `id` defaults to 0, which may match an unintended record.
- **Impact:** Could return or modify record with ID 0 unexpectedly. With auto-increment IDs this is unlikely to match, but it returns confusing "not found" errors instead of proper validation messages.
- **Recommendation:** Check the error from `strconv.Atoi` and return a 400 Bad Request if the parameter is not a valid integer.

### [H-003] CORS allows all origins
- **File:** `backend/main.go:69`
- **Category:** Security
- **Description:** `AllowOrigins: "*"` permits requests from any origin, including malicious websites.
- **Impact:** Combined with JWT stored in localStorage, a malicious site could make authenticated API calls on behalf of a logged-in user via CORS-enabled requests.
- **Recommendation:** Restrict `AllowOrigins` to the actual frontend origin (e.g., `http://localhost:3000`) and make it configurable via environment variable.

### [H-004] Missing username uniqueness check in Register
- **File:** `backend/internal/handlers/auth_handler.go:100-105`
- **Category:** Bug
- **Description:** The Register handler checks for duplicate email but does not check for duplicate username. The database has a unique index on username, so this will result in a raw database error being returned to the user.
- **Impact:** Users see an unhelpful internal server error instead of a clear "Username already exists" message.
- **Recommendation:** Add a username uniqueness check before creating the user, similar to the email check.

### [H-005] Debug print statements left in production code
- **File:** `backend/internal/handlers/booking_handler.go:58,133,137,141-142,150,160,164,167,173,176`
- **Category:** Code Quality
- **Description:** Multiple `fmt.Println` and `fmt.Printf` debug statements are left in the booking handler, including raw request body logging.
- **Impact:** Leaks request data to stdout logs. In production, this may expose sensitive information and creates noise in logs.
- **Recommendation:** Remove all debug `fmt.Println`/`fmt.Printf` statements. Use structured logging if debug output is needed.

### [H-006] ValidateRefreshToken does not check signing method
- **File:** `backend/internal/utils/jwt.go:46-50`
- **Category:** Security
- **Description:** `ValidateRefreshToken` uses `jwt.Parse` without verifying the signing method. Unlike `ExtractClaims` and `VerifyToken`, it does not check for `*jwt.SigningMethodHMAC`, making it vulnerable to algorithm confusion attacks.
- **Impact:** An attacker could potentially craft a token using a different algorithm (e.g., `none`) to bypass validation.
- **Recommendation:** Add signing method verification in the key function, consistent with `ExtractClaims`.

### [H-007] Seed data logs plaintext password
- **File:** `backend/internal/seed/seeder.go:80-81`
- **Category:** Security
- **Description:** The seeder logs `Password: admin123` in plaintext to stdout during startup.
- **Impact:** The admin password is visible in application logs. In containerized environments, logs may be collected by monitoring systems.
- **Recommendation:** Remove the password from log output.

### [H-008] Building cascade delete does not delete notifications
- **File:** `backend/internal/handlers/building_handler.go:136-172`
- **Category:** Bug
- **Description:** When deleting a building, the transaction deletes bookings, fixed_schedules, and rooms. However, it does not delete notifications associated with those bookings. This leaves orphaned notification records with invalid `booking_id` foreign keys.
- **Impact:** Database integrity violation. Querying notifications for deleted bookings may cause errors or return stale data.
- **Recommendation:** Add `tx.Where("booking_id IN ?", bookingIDs).Delete(&models.Notification{})` before deleting bookings.

### [H-009] Room delete does not cascade to bookings and schedules
- **File:** `backend/internal/handlers/room_handler.go:183-196`
- **Category:** Bug
- **Description:** The room delete handler directly deletes the room without cleaning up associated bookings, fixed_schedules, or notifications. If there are foreign key constraints, this will fail; if not, it leaves orphaned records.
- **Impact:** Either the delete fails with a database error, or orphaned booking/schedule records remain referencing a non-existent room.
- **Recommendation:** Use a transaction to delete associated bookings, notifications, and schedules before deleting the room, similar to building delete.

---

## Medium Priority Issues

### [M-001] RegisterCard form does not call the API
- **File:** `frontend/src/components/auth/RegisterCard.tsx:7-9`
- **Category:** Bug
- **Description:** The RegisterCard `handleSubmit` only calls `console.log('Registration submitted')` and does not make an API call to the register endpoint. The form collects first name and last name separately but the API expects a single `fullname` field.
- **Impact:** User registration from the frontend is completely non-functional.
- **Recommendation:** Implement the actual registration logic using `authApi.register()`, combining first name and last name into `fullname`.

### [M-002] DarkModeToggle duplicates ThemeContext state
- **File:** `frontend/src/components/auth/DarkModeToggle.tsx:1-49`
- **Category:** Code Quality
- **Description:** DarkModeToggle maintains its own `isDark` state and directly manipulates `document.documentElement.classList` and `localStorage`, duplicating the logic in `ThemeContext.tsx`. This can lead to state desynchronization between the toggle and the context.
- **Impact:** Theme state may become inconsistent when both the toggle and context try to manage dark mode independently.
- **Recommendation:** Use `useTheme()` from `ThemeContext` instead of maintaining separate state.

### [M-003] No pagination on list endpoints
- **File:** `backend/internal/handlers/building_handler.go:22-30`, `room_handler.go:21-29`, `booking_handler.go:36-67`, `user_handler.go:23-48`
- **Category:** Performance
- **Description:** All list endpoints (buildings, rooms, bookings, users, schedules) return all records without pagination. The response utilities include `PaginatedResponseJSON` but it is never used.
- **Impact:** As data grows, these endpoints will become increasingly slow and consume excessive memory. Loading thousands of bookings in a single response will degrade frontend and backend performance.
- **Recommendation:** Add `page` and `limit` query parameters to all list endpoints and use `PaginatedResponseJSON`.

### [M-004] N+1 query in building detail page
- **File:** `frontend/src/app/building/[id]/page.tsx:47-63`
- **Category:** Performance
- **Description:** For each room in a building, a separate API call is made to fetch schedules: `Promise.all(roomsData.map(async (room) => scheduleApi.getByRoomId(...)))`. With 10 rooms, this results in 10 additional HTTP requests.
- **Impact:** Slow page loads when a building has many rooms, creating unnecessary server load.
- **Recommendation:** Add a backend endpoint that returns schedules for all rooms in a building at once, or use the `schedules?room_id=X` endpoint with batching.

### [M-005] Booking time comparison uses string comparison
- **File:** `backend/internal/handlers/booking_handler.go:163`
- **Category:** Bug
- **Description:** `input.StartTime >= input.EndTime` compares times as strings. This works for `HH:MM` format but will fail for inconsistent formats (e.g., `9:00` vs `10:00` because `"9" > "1"` is true). The frontend sends `HH:MM` but the backend does not normalize the format.
- **Impact:** Time validation could produce incorrect results with single-digit hours, though HTML time inputs typically produce `HH:MM` format.
- **Recommendation:** Parse both times with `time.Parse` and compare as `time.Time` objects for robust comparison.

### [M-006] Schedule conflict check SQL has logic error
- **File:** `backend/internal/handlers/fixed_schedule_handler.go:384-389`
- **Category:** Bug
- **Description:** The conflict check query has three conditions joined by OR, but the second condition `(start_time < ? AND end_time > ?)` passes `endTime, endTime` which checks if an existing schedule's start is before the new end AND existing end is after the new end. This is a subset of the first condition and the third condition covers containment. The standard overlap check `(new_start < existing_end AND new_end > existing_start)` only needs two conditions.
- **Impact:** The query may miss certain overlap scenarios or produce false positives. The bulk create at line 327-330 has a different implementation that also differs.
- **Recommendation:** Simplify to the standard overlap formula: `WHERE start_time < :endTime AND end_time > :startTime`.

### [M-007] Booking date comparison may fail across timezones
- **File:** `backend/internal/handlers/booking_handler.go:170-175`
- **Category:** Bug
- **Description:** The "past date" check converts both dates to UTC before comparison. However, the BookingDate comes from user input as a date string (no timezone), and `time.Now().UTC()` represents the current moment in UTC. If the server is in UTC+7 and a user books for "today" at 11 PM server time (which is 4 PM UTC), the check may incorrectly reject it.
- **Impact:** Users in certain timezones may be unable to book for the current day, depending on server timezone configuration.
- **Recommendation:** Use the server's local time (or the configured timezone) for comparison instead of converting to UTC.

### [M-008] Unused imports and variables
- **File:** `frontend/src/app/page.tsx:227` (`console.log(booking)`), `frontend/src/app/admin/buildings/page.tsx:24` (`console.log(buildings)`), `frontend/src/components/auth/LoginNavbar.tsx:4` (unused `usePathname`)
- **Category:** Code Quality
- **Description:** Multiple files contain console.log statements and unused imports left from development.
- **Impact:** Clutters browser console in production, minor code quality issue.
- **Recommendation:** Remove all console.log statements and unused imports.

### [M-009] Error responses leak internal details
- **File:** `backend/internal/handlers/building_handler.go:27`, `room_handler.go:24`, and others
- **Category:** Security
- **Description:** Multiple handlers pass `err.Error()` directly to `InternalServerErrorResponse`, which sends the raw Go error message to the client. This may include database connection details, query information, or internal paths.
- **Impact:** Internal implementation details are exposed to API consumers, aiding potential attackers.
- **Recommendation:** Log the full error server-side and return a generic error message to the client.

### [M-010] No CSRF protection
- **File:** `backend/main.go:66-72`
- **Category:** Security
- **Description:** There is no CSRF protection middleware. While the API uses JWT Bearer tokens (which provides some CSRF protection since tokens are sent in headers, not cookies), the `AllowOrigins: "*"` CORS configuration weakens this.
- **Impact:** If an attacker can read the JWT from localStorage via XSS, they can make cross-origin requests freely.
- **Recommendation:** Restrict CORS origins and consider implementing CSRF tokens for state-changing operations.

### [M-011] Sidebar incorrectly restricts Visitor from booking
- **File:** `frontend/src/components/layout/Sidebar.tsx:18`
- **Category:** Bug
- **Description:** The sidebar sets `canBook = isAuthenticated && !isVisitor`, preventing Visitors from seeing booking menu items. However, according to the CLAUDE.md documentation, Visitors should have the same booking permissions as Teachers.
- **Impact:** Visitors cannot access booking functionality from the sidebar navigation, contrary to the documented permissions.
- **Recommendation:** Either update the sidebar to allow Visitors to book, or update the documentation to reflect the actual permission model.

### [M-012] User search query vulnerable to SQL injection via LIKE
- **File:** `backend/internal/handlers/user_handler.go:35`
- **Category:** Security
- **Description:** The search query uses `"fullname LIKE ? OR email LIKE ? OR username LIKE ?"` with `"%"+search+"%"`. While GORM parameterizes the query, the `%` wildcards in the search term are not escaped. A user could input `%` or `_` to construct broad LIKE patterns.
- **Impact:** Not a true SQL injection (GORM prevents that), but a user could craft search terms with SQL wildcards to enumerate all users more easily than intended.
- **Recommendation:** Escape LIKE special characters (`%`, `_`) in the search input before constructing the query.

### [M-013] LoginNavbar has unused pathname import
- **File:** `frontend/src/components/auth/LoginNavbar.tsx:4`
- **Category:** Code Quality
- **Description:** `usePathname` is imported and called but the result is not used (the related Link code is commented out).
- **Impact:** Unused import, minor bundle size impact.
- **Recommendation:** Remove the unused import and the commented-out code.

### [M-014] RequestLogger converts uint to rune for header
- **File:** `backend/internal/middleware/logger.go:39`
- **Category:** Bug
- **Description:** `c.Set("X-User-ID", string(rune(userID)))` converts the user ID to a Unicode code point, not to a decimal string. For example, user ID 65 would set the header to "A" instead of "65".
- **Impact:** The X-User-ID header contains incorrect/meaningless values. While `latency` and `status` are also unused (assigned to `_`), the header issue is more consequential.
- **Recommendation:** Use `strconv.FormatUint(uint64(userID), 10)` for the header value, or remove the unused middleware entirely.

---

## Low Priority Issues

### [L-001] Inconsistent error response patterns
- **File:** `backend/internal/handlers/role_handler.go:59-67`, `user_handler.go:85-93`, `user_handler.go:242-249`, `role_handler.go:147-154`
- **Category:** Code Quality
- **Description:** Some handlers return errors using `utils.ValidationErrorResponse` while others manually construct `fiber.Map` responses with the same structure. This creates inconsistency in the codebase.
- **Impact:** Makes maintenance harder and may result in slight response format differences.
- **Recommendation:** Consistently use the `utils` response helpers throughout all handlers.

### [L-002] Frontend uses alert() for user feedback
- **File:** `frontend/src/app/admin/bookings/page.tsx:80-81,108`, `frontend/src/app/admin/users/page.tsx:61,69,79,81`
- **Category:** Code Quality
- **Description:** Multiple admin pages use `alert()` and `confirm()` for user feedback and confirmation dialogs instead of proper UI components.
- **Impact:** Poor user experience, blocks the main thread, and looks unprofessional.
- **Recommendation:** Replace with toast notifications and the existing `DeleteConfirmModal` pattern.

### [L-003] Duplicate helper function definitions
- **File:** `backend/internal/config/database.go:14-28` and `backend/internal/config/smtp.go:25-67`
- **Category:** Code Quality
- **Description:** Both files define nearly identical `getEnv`/`getEnvStr` and `getEnvInt`/`getEnvAsInt` helper functions.
- **Impact:** Code duplication; changes to one must be mirrored in the other.
- **Recommendation:** Consolidate into a single shared `env.go` file in the config package.

### [L-004] Booking.Room not preloaded in GetMyBookings and GetAll
- **File:** `backend/internal/handlers/booking_handler.go:39,99`
- **Category:** Performance
- **Description:** `GetAll` and `GetMyBookings` preload `User.Role` but not `Room.Building`. The frontend must then separately fetch rooms and buildings to display booking details.
- **Impact:** Additional API calls from the frontend to get room/building names for each booking.
- **Recommendation:** Add `.Preload("Room.Building")` to these queries.

### [L-005] GetByRoomAndDate route does not match documented API
- **File:** `backend/internal/routes/routes.go:53`
- **Category:** Code Quality
- **Description:** The route is `rooms.Get("/:id/availability", bookingHandler.GetByRoomAndDate)` but the handler comment says `GET /bookings/room/:room_id/availability`. The actual route path is `/api/v1/rooms/:id/availability`.
- **Impact:** Documentation mismatch may confuse developers.
- **Recommendation:** Update the handler comment to match the actual route.

### [L-006] Frontend booking page text says "wait for admin approval" but auto-approves
- **File:** `frontend/src/app/booking/page.tsx:237`
- **Category:** Code Quality
- **Description:** The booking page subtitle says "wait for admin approval" but the backend auto-approves bookings (status defaults to "approved" at booking_handler.go:216). The success message was updated but the subtitle was not.
- **Impact:** User confusion about the booking workflow.
- **Recommendation:** Update the subtitle to match the actual auto-approval behavior.

### [L-007] Missing key prop warning potential in home page table
- **File:** `frontend/src/app/page.tsx:328-429`
- **Category:** Code Quality
- **Description:** The nested `.map()` calls in the schedule table return arrays of arrays. React requires unique keys for list items and the deeply nested structure may produce key warnings.
- **Impact:** React may not efficiently update the DOM, and console warnings will appear in development.
- **Recommendation:** Flatten the rendering or ensure unique keys at each nesting level.

### [L-008] Forgot password link points to non-existent page
- **File:** `frontend/src/components/auth/LoginCard.tsx:108`
- **Category:** Bug
- **Description:** The "forgot password" link points to `/forgetpassword` but there is no page at that route.
- **Impact:** Users clicking "forgot password" see a 404 page.
- **Recommendation:** Either implement the forgot password page or remove/disable the link.

---

## Positive Observations

- Well-structured Go backend following MVC pattern with clear separation of handlers, models, routes, and middleware.
- Consistent use of GORM for database operations with proper relationship definitions and preloading.
- Good use of transactions for cascade deletes (building handler).
- JWT implementation includes signing method verification in `ExtractClaims` and `VerifyToken` to prevent algorithm confusion attacks.
- Frontend uses proper auth patterns with `withAuth` and `withRole` HOCs for route protection.
- Email service implementation with worker pool, queue, retry mechanism, and graceful shutdown is well-designed.
- Notification service properly separates concerns and uses async email sending to avoid blocking API responses.
- Custom date type with proper JSON marshaling/unmarshaling and database scanning.
- Consistent dark mode support across all frontend components.
- Booking conflict detection checks both existing bookings and fixed schedules.
- Rate limiting implementation for booking creation prevents abuse.
- Input validation using `go-playground/validator` with custom validators for Silpakorn email, time format, etc.

---

## Recommendations

1. **Fix the unauthenticated endpoints immediately** (C-003, C-004). The GET /bookings and POST /test/email routes expose data and functionality without any authentication. This is the highest-impact fix.

2. **Remove hardcoded credentials and validate JWT secret** (C-001, C-002). Add startup validation to ensure `JWT_SECRET` and `DB_PASSWORD` are provided via environment variables. Remove all hardcoded defaults for secrets.

3. **Fix the type assertion panic in rate limiter** (C-005) and the wrong parameter name in GetByRoomAndDate (H-001). These are runtime bugs that will affect production.

4. **Implement the registration form** (M-001). The signup page is non-functional -- it collects data but never calls the API.

5. **Add pagination to all list endpoints** (M-003) before the database grows. The `PaginatedResponseJSON` utility already exists but is unused.
