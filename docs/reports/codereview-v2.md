# Code Review Report v2 -- SU Booking Room

**Date:** 2026-03-24
**Reviewer:** Automated Code Review Agent (Round 2)
**Scope:** Full codebase re-review after security fixes

---

## Previous Fix Verification

| # | Fix | Status | Notes |
|---|-----|--------|-------|
| 1 | CORS changed from `*` to env var `CORS_ORIGINS` | Verified | `main.go:68-76` reads `CORS_ORIGINS` env var, falls back to `http://localhost:3000` |
| 2 | Hardcoded DB credentials removed | Verified | `database.go:41-43` uses `getEnvRequired()` for `DB_USER` and `DB_PASSWORD` -- fatal if missing |
| 3 | JWT_SECRET validated at startup (min 32 chars) | Verified | `jwt.go:14-22` checks `JWT_SECRET` env var existence and length, calls `log.Fatal` if invalid |
| 4 | GET /bookings now requires auth + admin only | Verified | `routes.go:71` uses `middleware.AuthMiddleware, middleware.AdminOnly` |
| 5 | Test email endpoint + test_handler.go removed | Verified | No `test_handler.go` found. Test email moved to admin-only `POST /notifications/test-email` at `routes.go:110` |
| 6 | Debug fmt.Println/Printf removed from booking_handler.go | Verified | No debug print statements found in `booking_handler.go` |
| 7 | Rate limiter type assertion uses comma-ok pattern | Verified | `rate_limiter.go:51` uses `userID, ok := c.Locals("user_id").(uint)` |
| 8 | GetByRoomAndDate route param mismatch fixed | Verified | `routes.go:53` uses `/rooms/:id/availability` and `booking_handler.go:69` reads `c.Params("id")` |
| 9 | Unchecked strconv.Atoi fixed across all handlers | Verified | All `strconv.Atoi` calls across handlers now check error and return `BadRequestResponse` |

---

## Summary

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Bugs | 1 | 2 | 3 | 2 |
| Security | 1 | 2 | 3 | 1 |
| Performance | 0 | 1 | 3 | 1 |
| Code Quality | 0 | 0 | 3 | 4 |
| **Total** | **2** | **5** | **12** | **8** |

**Grand Total: 27 issues** (down from 36 in v1, with 9 fixes verified)

---

## Issues Found

### Critical

#### CR2-C01: XSS in Email Fallback Template via Unescaped User Input
- **File:** `backend/internal/services/email_service.go:230-234`
- **Category:** Security
- **Description:** The `renderFallbackTemplate` function uses `fmt.Sprintf("<p>%s</p>", msg)` to inject user-controlled data (booking title, user name, details) directly into HTML without escaping. This allows stored XSS attacks through booking titles or status notes that could execute when the admin or user views the email.
- **Impact:** Stored XSS via email. Attacker could inject malicious HTML/JavaScript in booking titles that renders in emails.
- **Recommendation:** Use `html/template` or `html.EscapeString()` to sanitize all data before inserting into HTML.

#### CR2-C02: Multi-Booking Conflict Check is Not Atomic
- **File:** `backend/internal/handlers/multi_booking_handler.go:115-152`
- **Category:** Bug
- **Description:** The conflict check for each room (lines 115-152) happens outside the transaction (lines 158-194). Between the conflict check and the transaction that creates bookings, another concurrent request could book the same slot. This is a TOCTOU (Time-of-Check/Time-of-Use) race condition.
- **Impact:** Two users could simultaneously book the same room/time slot through the multi-booking endpoint, resulting in double-bookings.
- **Recommendation:** Move the conflict checks inside the database transaction, ideally using `SELECT ... FOR UPDATE` or a database-level unique constraint on (room_id, booking_date, start_time, end_time) for non-cancelled bookings.

### High Priority

#### CR2-H01: Single-Booking Conflict Check Also Has Race Condition
- **File:** `backend/internal/handlers/booking_handler.go:181-189`
- **Category:** Bug
- **Description:** Same TOCTOU issue as CR2-C02. The conflict count check and the subsequent `Create` are not in a transaction. Two concurrent requests could pass the conflict check simultaneously.
- **Impact:** Double-booking possible under concurrent requests for single-room bookings as well.
- **Recommendation:** Wrap the conflict check and creation in a transaction with row-level locking, or add a database constraint.

#### CR2-H02: Admin Seed Password Logged to Console
- **File:** `backend/internal/seed/seeder.go:80-82`
- **Category:** Security
- **Description:** The admin seed function logs the password in plaintext: `log.Println("  Password: admin123")`. This password appears in server logs.
- **Impact:** Plaintext credentials in logs. Anyone with log access can see the admin password.
- **Recommendation:** Remove the password from log output. Only log that the admin user was created.

#### CR2-H03: Weak Default Admin Password
- **File:** `backend/internal/seed/seeder.go:59`
- **Category:** Security
- **Description:** The admin seed password is `admin123` (8 characters, trivially guessable). The CLAUDE.md documentation says `password123` but the actual seeder uses `admin123`.
- **Impact:** If the seed runs in production, the admin account has a trivially weak password.
- **Recommendation:** Generate a random password at seed time and print it once, or require it via an environment variable. Also update CLAUDE.md to reflect the actual password.

#### CR2-H04: No Pagination on List Endpoints
- **File:** `backend/internal/handlers/booking_handler.go:35-65`, `user_handler.go:23-48`, `room_handler.go:21-29`
- **Category:** Performance
- **Description:** `GetAll` endpoints for bookings, users, rooms, buildings, schedules, and notifications all return every record without pagination. As data grows, these will cause memory and performance issues.
- **Impact:** Large response payloads causing slow API responses and high memory usage.
- **Recommendation:** Add `page` and `limit` query parameters using the already-defined `PaginatedResponse` utility in `response.go:68-84`.

#### CR2-H05: Notification Handler Error Message Comparison is Brittle
- **File:** `backend/internal/handlers/notification_handler.go:69,98`
- **Category:** Bug
- **Description:** The handler checks `err.Error() == "notification not found or access denied"` to determine the response type. If the error message in `notification_service.go` changes, this breaks silently and returns 500 instead of 404.
- **Impact:** Incorrect HTTP status codes if error messages change. Fragile coupling between handler and service.
- **Recommendation:** Define sentinel errors (e.g., `var ErrNotFound = errors.New(...)`) in the service and compare with `errors.Is()`.

### Medium Priority

#### CR2-M01: SMTP Password Stored in Plain Config Struct
- **File:** `backend/internal/config/smtp.go:15`
- **Category:** Security
- **Description:** The `SMTPConfig.Password` field stores the SMTP password as a plain string in memory for the lifetime of the application. While env-var sourced, the struct could be inadvertently logged or serialized.
- **Impact:** Low risk but the password could be exposed via debugging or reflection-based logging.
- **Recommendation:** Consider a getter function instead of storing the raw password in the struct, or mark the field explicitly to avoid accidental serialization.

#### CR2-M02: Building Update Allows Setting Empty Name
- **File:** `backend/internal/handlers/building_handler.go:115-117`
- **Category:** Bug
- **Description:** `building_handler.go:116` sets `building.Name = input.Name` directly without checking if `input.Name` is empty. An update request with `{"name":"","description":"test"}` would set the building name to an empty string.
- **Impact:** Data integrity issue -- buildings could have empty names.
- **Recommendation:** Add validation to reject empty names in update, similar to the Create handler.

#### CR2-M03: Room Update Cannot Set Capacity to Zero
- **File:** `backend/internal/handlers/room_handler.go:173-175`
- **Category:** Bug
- **Description:** `room_handler.go:173` checks `if input.Capacity != 0` before updating. This means you cannot intentionally set a room's capacity to 0 (e.g., for marking it as unavailable).
- **Impact:** Minor -- cannot reset capacity to zero.
- **Recommendation:** Use a pointer type `*int` for the update input struct to distinguish between "not provided" and "set to zero".

#### CR2-M04: User Search Uses LIKE Without Sanitization
- **File:** `backend/internal/handlers/user_handler.go:35`
- **Category:** Security
- **Description:** The search query uses `LIKE ? OR ...` with `"%"+search+"%"`. While parameterized (safe from SQL injection), the `%` and `_` SQL wildcards in user input are not escaped. A search for `%` returns all users.
- **Impact:** Minor information disclosure -- a crafted search string could bypass intended filtering.
- **Recommendation:** Escape `%` and `_` characters in the search input before wrapping with `%`.

#### CR2-M05: Hardcoded Role ID 3 for Registration Default
- **File:** `backend/internal/handlers/auth_handler.go:119`
- **Category:** Bug
- **Description:** `auth_handler.go:119` hardcodes `RoleID: 3` (Visitor) for new registrations. If roles are ever reordered or IDs change, this breaks silently.
- **Impact:** If role IDs change, new users get the wrong role.
- **Recommendation:** Look up the "visitor" role by name instead of hardcoding the ID, or define it as a constant with validation.

#### CR2-M06: Hardcoded Role ID 1 for Admin Checks in Handlers
- **File:** `backend/internal/handlers/booking_handler.go:126`, `multi_booking_handler.go:233,261`
- **Category:** Code Quality
- **Description:** Multiple handlers hardcode `roleID != 1` to check for admin access instead of using the constants defined in `middleware/role.go:9` (`RoleAdmin = 1`).
- **Impact:** If the admin role ID changes, these checks break. Inconsistent with middleware approach.
- **Recommendation:** Import and use `middleware.RoleAdmin` constant or create a shared helper.

#### CR2-M07: Email Service Stop() Closes Queue After StopChan
- **File:** `backend/internal/services/email_service.go:84-94`
- **Category:** Bug
- **Description:** `Stop()` closes `stopChan` first, then waits for workers to finish with `wg.Wait()`, then closes `queue`. However, the worker select loop (lines 127-139) can receive from both `queue` and `stopChan`. When `stopChan` closes, workers exit immediately, potentially leaving jobs in the queue unprocessed. Then `close(s.queue)` is called on a potentially non-empty channel.
- **Impact:** Emails queued just before shutdown may be silently dropped.
- **Recommendation:** Drain the queue before closing, or close the queue first and let workers process remaining items before checking stopChan.

#### CR2-M08: RegisterRequest Does Not Check Username Uniqueness
- **File:** `backend/internal/handlers/auth_handler.go:100-105`
- **Category:** Security
- **Description:** The Register handler only checks email uniqueness (`auth_handler.go:101-105`) but not username uniqueness before creation. The database has a unique index on username, so this will fail with an unformatted database error.
- **Impact:** Poor UX -- users get a generic 500 error instead of "Username already exists" message.
- **Recommendation:** Add a username uniqueness check similar to the email check, returning a proper conflict response.

#### CR2-M09: RecoverMiddleware Does Not Return Error
- **File:** `backend/internal/middleware/error.go:50-58`
- **Category:** Bug
- **Description:** `RecoverMiddleware` catches panics but calls `utils.InternalServerErrorResponse(c, ...)` inside a deferred function. The return value is discarded because it cannot be returned from a deferred function. However, since Fiber's built-in `recover.New()` is used in `main.go:66`, this custom middleware is likely unused dead code.
- **Impact:** If used, panic recovery would silently fail to send a response. As dead code, it adds confusion.
- **Recommendation:** Remove `RecoverMiddleware` since `recover.New()` is already used, or fix it to write the response directly.

#### CR2-M10: RequestLogger Converts UserID to Rune Incorrectly
- **File:** `backend/internal/middleware/logger.go:39`
- **Category:** Bug
- **Description:** `string(rune(userID))` converts the numeric user ID to a Unicode code point, not a string representation. For userID=65, this produces "A" instead of "65".
- **Impact:** The `X-User-ID` header will contain garbage characters instead of the actual user ID.
- **Recommendation:** Use `strconv.FormatUint(uint64(userID), 10)` instead. Also, this middleware appears unused -- consider removing it.

#### CR2-M11: SeedHandler ClearAll Does Not Delete Notifications or BookingGroups
- **File:** `backend/internal/handlers/seed_handler.go:231-254`
- **Category:** Bug
- **Description:** `ClearAll` deletes bookings, fixed_schedules, rooms, buildings, and non-admin users. But it does not delete `notifications` or `booking_groups` records. This could cause foreign key constraint errors or orphaned data.
- **Impact:** Orphaned notification and booking_group records after clearing seed data. Potential FK constraint violations.
- **Recommendation:** Add `DELETE FROM notifications` and `DELETE FROM booking_groups` before deleting bookings.

### Low Priority

#### CR2-L01: Console.log Left in Production Code
- **File:** `frontend/src/app/admin/buildings/page.tsx:24`
- **Category:** Code Quality
- **Description:** `console.log(buildings)` is left in the component body, logging all building data to the browser console on every render.
- **Impact:** Information leakage in browser console; minor performance impact from re-renders.
- **Recommendation:** Remove the `console.log(buildings)` statement.

#### CR2-L02: `database.go:57` Uses fmt.Println for DB Connection Success
- **File:** `backend/internal/config/database.go:57`
- **Category:** Code Quality
- **Description:** Uses `fmt.Println("Successfully connected to database with GORM!")` instead of `log.Println()`. This bypasses any log configuration (timestamp, file, etc.).
- **Impact:** Inconsistent logging.
- **Recommendation:** Replace with `log.Println()`.

#### CR2-L03: Unused Imports/Variables in Logger Middleware
- **File:** `backend/internal/middleware/logger.go:44-48`
- **Category:** Code Quality
- **Description:** `RequestLogger` assigns `latency` and `status` then discards them with `_ = latency` and `_ = status`. This function does nothing useful beyond calling `c.Next()`.
- **Impact:** Dead code adding complexity.
- **Recommendation:** Either implement the logging logic or remove the `RequestLogger` function entirely.

#### CR2-L04: Sidebar Incorrectly Hides Booking for Visitors
- **File:** `frontend/src/components/layout/Sidebar.tsx:18`
- **Category:** Bug
- **Description:** `canBook = isAuthenticated && !isVisitor` prevents visitors from seeing the booking menu. However, per CLAUDE.md, visitors should have the same booking rights as teachers ("Visitor: Book rooms, view rooms, manage own bookings").
- **Impact:** Visitors cannot access booking pages through the sidebar navigation.
- **Recommendation:** Either update the Sidebar to show booking links for visitors, or update the documentation to reflect the actual intended permissions.

#### CR2-L05: Booking Form Uses `withRole(['admin', 'teacher'])` Excluding Visitors
- **File:** `frontend/src/app/booking/page.tsx:730`, `frontend/src/app/my-bookings/page.tsx:497`
- **Category:** Code Quality
- **Description:** Both booking page and my-bookings page use `withRole(Page, ['admin', 'teacher'])`, excluding visitors. This should match the intended permissions from CLAUDE.md.
- **Impact:** Visitors cannot access booking features even though CLAUDE.md says they should have the same rights as teachers.
- **Recommendation:** If visitors should book, add `'visitor'` to the allowed roles. If not, update CLAUDE.md.

#### CR2-L06: ManageUsersPage Missing MainLayout Wrapper
- **File:** `frontend/src/app/admin/users/page.tsx:123`
- **Category:** Code Quality
- **Description:** The users admin page renders directly with a `<div>` wrapper instead of using `<MainLayout>` like all other admin pages. This causes inconsistent navigation -- no sidebar/header.
- **Impact:** Inconsistent UI -- the users page lacks the sidebar and header navigation present on all other pages.
- **Recommendation:** Wrap the page content in `<MainLayout>`.

#### CR2-L07: NotificationsSettingsPage Missing MainLayout Wrapper
- **File:** `frontend/src/app/admin/notifications/page.tsx:65`
- **Category:** Code Quality
- **Description:** Same as CR2-L06. The notifications settings page does not use `<MainLayout>`.
- **Impact:** Inconsistent UI navigation.
- **Recommendation:** Wrap the page content in `<MainLayout>`.

#### CR2-L08: JWT Token Type Not Validated on Access
- **File:** `backend/internal/utils/jwt.go:107-143`
- **Category:** Security
- **Description:** `ExtractClaims()` does not check the `token_type` claim. A refresh token (which has `token_type: "refresh"`) could be used as an access token since both have the same claims structure and signing key. `ValidateRefreshToken()` checks type, but `ExtractClaims()` does not.
- **Impact:** Refresh tokens (7-day lifetime) could be used as access tokens (24-hour intended lifetime), extending the effective session beyond the intended duration.
- **Recommendation:** Add `token_type == "access"` check in `ExtractClaims()`.

---

## New Feature Review

### SMTP Email Service

- **Correctness:** The service is well-structured with a worker pool pattern, retry mechanism, and graceful shutdown. Template loading with fallback is sensible.
- **Security Concerns:**
  - **CR2-C01 (Critical):** Fallback template injects user data without HTML escaping.
  - SMTP credentials read from env vars (good). Password stored as plain string in struct (noted in CR2-M01).
  - Test email endpoint is admin-only (good).
- **Error Handling:** Good -- retry with delay, logging of failures, timeout on queue full. Email status tracked in notifications table.
- **Overall:** Solid implementation. Fix the XSS in the fallback template and consider the queue drain issue on shutdown.

### Multi-Room Booking

- **Transaction Safety:**
  - The booking group and individual bookings are created within a single database transaction (good).
  - **CR2-C02 (Critical):** The conflict checks happen outside the transaction, creating a race condition.
- **Conflict Detection:** Correctly checks both booking conflicts and fixed schedule conflicts for each room. Day-of-week calculation handles Sunday correctly (maps 0 to 7).
- **API Design:** Clean request/response structure. Group-based cancel and view operations work correctly with proper ownership checks. The `min=2` room requirement is validated.
- **Overall:** Good feature design. The primary concern is moving conflict checks inside the transaction for atomicity.

---

## Positive Observations

- **Consistent error response format** across all handlers using `utils.*Response()` helpers.
- **Well-structured route organization** with clear separation of public/auth/admin routes.
- **JWT implementation** validates signing method to prevent algorithm confusion attacks (`jwt.go:94,110`).
- **Rate limiter** with per-user tracking and automatic cleanup is a good pattern for preventing booking abuse.
- **Frontend type safety** with comprehensive TypeScript interfaces matching the backend API contract.
- **Transaction usage** in building cascade delete and multi-booking creation prevents partial data states.
- **Email service** worker pool with retry, graceful shutdown, and queue monitoring is production-ready.
- **Role-based access control** is consistently applied across both frontend (withRole HOC) and backend (middleware).
- **Input validation** using `go-playground/validator` with custom validators (Silpakorn email, time formats) is thorough.

---

## Top 5 Recommendations

1. **Fix race conditions in booking creation** -- Move conflict checks inside database transactions for both single and multi-booking endpoints (CR2-C02, CR2-H01). This is the highest-impact bug: double-bookings corrupt the core business logic.

2. **Sanitize HTML in email templates** -- Use `html.EscapeString()` or `html/template` for all user-provided data in the fallback email renderer (CR2-C01). This prevents stored XSS attacks via booking titles.

3. **Add pagination to all list endpoints** -- The `PaginatedResponse` utility already exists but is unused. Add `page`/`limit` query parameters to bookings, users, rooms, schedules, and notifications endpoints (CR2-H04).

4. **Replace magic numbers with constants** -- Use `middleware.RoleAdmin` instead of hardcoded `1` in handlers, and look up the visitor role by name instead of hardcoding `3` for registration (CR2-M05, CR2-M06).

5. **Fix frontend layout consistency** -- Wrap admin/users and admin/notifications pages in `MainLayout`, fix visitor booking permissions to match documentation, and remove stray `console.log` (CR2-L01, CR2-L06, CR2-L07).
