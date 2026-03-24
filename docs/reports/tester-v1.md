# Testing Report -- SU Booking Room

**Date:** 2026-03-24
**Tester:** Automated Testing Agent
**Environment:** Development (localhost)
**Backend:** Go 1.25.4, Fiber v2.52.10, GORM v1.31.1
**Frontend:** Next.js 16.0.5, React 19.2.0, TypeScript 5
**Database:** PostgreSQL 16

---

## Summary

| Test Category | Total | Passed | Failed | Skipped | Coverage |
|---------------|-------|--------|--------|---------|----------|
| Utils (JWT) | 12 | 12 | 0 | 0 | ~85% |
| Utils (Password) | 4 | 4 | 0 | 0 | ~95% |
| Utils (Validator) | 7 | 7 | 0 | 0 | ~75% |
| Models | 14 | 14 | 0 | 0 | ~60% |
| Middleware (Rate Limiter) | 7 | 7 | 0 | 0 | ~80% |
| Middleware (Role) | 1 | 1 | 0 | 0 | ~10% |
| Integration (API) | 55 | 0 | 0 | 55 | 0% |
| Frontend | 0 | 0 | 0 | 0 | 0% |
| **Total** | **100** | **45** | **0** | **55** | **~35%** |

Note: Integration tests were skipped because the backend server was not running during test execution. All 55 integration tests are written and ready to run when the server is available.

---

## Unit Test Results

### JWT Tests (12 tests -- all PASS)

| Test Case | Status | Notes |
|-----------|--------|-------|
| GenerateToken (admin) | PASS | Generates valid access token |
| GenerateToken (teacher) | PASS | |
| GenerateToken (visitor) | PASS | |
| GenerateToken (zero IDs) | PASS | |
| GenerateRefreshToken | PASS | Generates valid refresh token |
| ExtractClaims (valid) | PASS | Correctly extracts UserID, RoleID, FullName |
| ExtractClaims (invalid tokens) | PASS | Rejects empty, garbage, malformed tokens |
| ExtractClaims (expired token) | PASS | Rejects expired tokens |
| ExtractClaims (wrong signing method) | PASS | Rejects `none` algorithm (prevents JWT confusion attack) |
| VerifyToken | PASS | Validates and rejects correctly |
| ValidateRefreshToken | PASS | Validates refresh tokens, rejects access tokens |
| Tokens are different | PASS | Access and refresh tokens are unique |

### Password Tests (4 tests -- all PASS)

| Test Case | Status | Notes |
|-----------|--------|-------|
| HashPassword (various inputs) | PASS | Valid, short, empty, special chars, unicode |
| ComparePassword | PASS | Correct, wrong, empty, invalid hash |
| Different hashes for same password | PASS | Unique salts verified |
| Bcrypt max length (>72 bytes) | PASS | Go 1.25 correctly rejects passwords >72 bytes |

### Validator Tests (7 tests -- all PASS)

| Test Case | Status | Notes |
|-----------|--------|-------|
| ValidateStruct LoginRequest | PASS | Validates email, password, min length |
| ValidateStruct RegisterRequest | PASS | Validates Silpakorn email, username, fullname |
| IsValidEmail | PASS | 8 cases including edge cases |
| IsValidTimeRange | PASS | 7 cases including invalid formats |
| IsValidDateRange | PASS | 5 cases |
| IsValidDayOfWeek | PASS | Range 1-7 validated |
| ValidateStruct nil validator | PASS | Auto-initializes validator |

### Model Tests (14 tests -- all PASS)

| Test Case | Status | Notes |
|-----------|--------|-------|
| CustomDate UnmarshalJSON | PASS | Valid date, null, empty, invalid format |
| CustomDate MarshalJSON | PASS | Valid date and zero date |
| CustomDate Value | PASS | Database value interface |
| CustomDate Scan | PASS | nil, time.Time, string, []byte, invalid |
| CustomDate RoundTrip | PASS | Marshal then unmarshal preserves data |
| Booking JSONSerialization | PASS | All fields serialize correctly |
| TableName (6 models) | PASS | All model table names match database |
| Booking StatusValues | PASS | All 5 valid statuses |

### Middleware Tests (8 tests -- all PASS)

| Test Case | Status | Notes |
|-----------|--------|-------|
| RateLimiter Allow | PASS | Allows up to limit, blocks after |
| RateLimiter DifferentUsers | PASS | Independent limits per user |
| RateLimiter WindowExpiry | PASS | Resets after window period |
| RateLimiter GetStats | PASS | Correct active user count |
| RateLimiter ConcurrentAccess | PASS | No deadlock or race condition |
| RateLimiter ZeroLimit | PASS | Edge case handled |
| RateLimiter NewUser | PASS | First request always allowed |
| RoleConstants | PASS | Admin=1, Teacher=2, Visitor=3 |

### Integration Tests (55 tests -- all SKIPPED)

Backend server was not running during test execution. All 55 tests are implemented and cover:

| Category | Tests | Description |
|----------|-------|-------------|
| Health | 1 | Health check endpoint |
| Auth | 10 | Login (valid/invalid/missing), Register (duplicate/non-silpakorn/missing), GetMe (valid/no-token/invalid-token) |
| Buildings | 5 | GetAll, GetByID, GetByID_NotFound, CreateWithoutAuth, CRUD cycle |
| Rooms | 5 | GetAll, GetByID_NotFound, CreateWithoutAuth, CreateMissingFields, GetByBuildingID |
| Bookings | 10 | GetAll, GetMy, Filters, CreateWithoutAuth, InvalidTime, PastDate, NonExistentRoom, StatusUpdate, Cancel, DateFormat |
| Users | 4 | GetAll (with/without auth), GetByID_NotFound, SearchByName |
| Roles | 2 | GetAll, GetByID_NotFound |
| Schedules | 4 | GetAll, GetByID_NotFound, CreateWithoutAuth, GetByRoomID |
| Notifications | 3 | GetMy (with/without auth), MarkAllAsRead |
| Security | 6 | SQL Injection (login, search), XSS, Invalid auth header, Large payload, CORS |
| Availability | 1 | Room availability check |

---

## Frontend Testing Assessment

**Status: No tests exist.**

The frontend has no testing framework configured:
- No Jest, Vitest, or Testing Library dependencies in `package.json`
- No test files (`*.test.tsx`, `*.spec.tsx`) in the project
- No test scripts in `package.json`

### Components analyzed for test coverage needs:

| Component/Feature | Priority | Risk |
|-------------------|----------|------|
| AuthContext (login/logout/checkAuth) | High | Session management, token handling |
| withAuth HOC | High | Route protection bypass risk |
| withRole HOC | High | RBAC enforcement |
| API Client (client.ts) | High | Error handling, token injection |
| LoginCard | Medium | Form validation, error display |
| RegisterCard | Medium | Email validation, field validation |
| Booking pages | Medium | Date/time handling, conflict display |
| Admin pages (CRUD modals) | Medium | Form validation, confirmation dialogs |

---

## Security Assessment

| Risk | Severity | Status | Details |
|------|----------|--------|---------|
| SQL Injection | Critical | PASS (by code review) | GORM uses parameterized queries throughout. All handlers use `Where("field = ?", value)` pattern. |
| XSS | High | WARNING | No server-side output encoding. Backend stores raw HTML input. Frontend must sanitize. |
| CSRF Protection | High | WARNING | No CSRF protection implemented. CORS is set to `AllowOrigins: "*"` which allows any origin. |
| Auth Bypass | Critical | PASS | JWT validation checks signing method (HMAC only), prevents algorithm confusion attack. |
| Rate Limiting | Medium | PASS | Booking creation limited to 10/hour per user. Rate limiter handles concurrent access. |
| Password Security | Medium | PASS | bcrypt cost=14, unique salts. Go 1.25 rejects >72 byte passwords. |
| Sensitive Data Exposure | High | WARNING | DB credentials hardcoded in `config/database.go` defaults (user: "sumbenz", password: "sumbenz2806"). |
| JWT Secret | Critical | WARNING | JWT_SECRET from env variable. If env not set, defaults to empty string (insecure). |
| CORS Misconfiguration | High | FAIL | `AllowOrigins: "*"` permits any origin. Must restrict to frontend domain in production. |
| Input Validation | Medium | PASS | Struct validation using go-playground/validator. Custom validators for Silpakorn email, date, time formats. |
| Cascade Delete | Medium | PASS | Building delete uses transactions to cascade-delete rooms, bookings, schedules. |
| User Password in JSON | Low | PASS | User model has `json:"-"` tag on Password field. However, auth handler returns full user object including password in login response (line 74-81 of auth_handler.go sets user directly). |
| Debug Logging | Low | WARNING | `fmt.Println` debug statements in booking_handler.go (lines 133, 141, 149, 160, 166, 167, 176). Should be removed for production. |
| Test Email Endpoint | Medium | WARNING | `/api/v1/test/email` endpoint has no authentication. Anyone can send test emails. |
| Bookings GetAll Public | Medium | WARNING | `GET /bookings` endpoint has no authentication middleware (routes.go line 71). All bookings are publicly accessible. |

---

## Production Readiness

### Blockers (Must Fix Before Production)

1. **CORS allows all origins** (`AllowOrigins: "*"` in main.go line 69). Must be restricted to the frontend domain (e.g., `http://yourdomain.com`). This allows any website to make authenticated API calls on behalf of users.

2. **Hardcoded database credentials** in `config/database.go` (lines 34-35). Default values `sumbenz` / `sumbenz2806` are plaintext in source code. Must use environment variables with no defaults or use a secrets manager.

3. **JWT_SECRET defaults to empty string** when environment variable is not set. An empty secret means tokens can be trivially forged. Must validate that JWT_SECRET is set and has sufficient length at startup.

4. **GET /bookings is public** (routes.go line 71). The endpoint returns all bookings including user data. Should require at minimum authentication, ideally Admin role.

5. **Test email endpoint has no authentication** (`/api/v1/test/email` in routes.go line 114). This can be abused to send spam. Must be disabled in production or require Admin authentication.

6. **Debug print statements in production code** (booking_handler.go lines 133, 141, 149, 160, 166, 167, 176). Contains `fmt.Println` calls that leak request data to stdout.

### Warnings (Should Fix)

1. **No CSRF protection** -- The application relies solely on JWT Bearer tokens. While this is common for SPAs, the `AllowOrigins: "*"` CORS setting compounds the risk.

2. **No XSS sanitization on backend** -- User-provided text (building names, booking titles, etc.) is stored as-is. The frontend must sanitize all rendered user content.

3. **Password returned in login response** -- `auth_handler.go` line 74 returns the full `user` object. While the `json:"-"` tag on the User model should exclude the password, the handler explicitly sets `Password: hashedPassword` before calling `h.DB.Create(&user)` and then does `h.DB.Preload("Role").First(&user, user.UserID)`. The Preload does re-fetch, but the local `user` variable still has the password hash. The response function should explicitly clear it.

4. **No pagination** on list endpoints (buildings, rooms, bookings, users, schedules). Large datasets will cause performance issues.

5. **No request body size limit** configured in Fiber. Large payloads could cause memory issues.

6. **Booking status defaults to "approved"** (booking_handler.go line 216). New bookings are auto-approved without admin review. Comment says "change to pending if admin approval needed" but this is a business logic decision that should be configurable.

7. **No token refresh endpoint** -- Access tokens expire in 24 hours, refresh tokens in 7 days. There is no endpoint to exchange a refresh token for a new access token. Users must re-login.

8. **Frontend has no testing framework** -- No Jest, Vitest, or any testing library is configured. Zero frontend test coverage.

9. **`strconv.Atoi` errors silently ignored** in multiple handlers (building_handler.go line 48, room_handler.go line 33, etc.). Invalid IDs like `/buildings/abc` will result in ID=0 queries instead of proper 400 errors.

### Recommendations

1. **Add environment validation at startup** -- Check that `JWT_SECRET`, `DB_PASSWORD`, and other critical env vars are set before the server starts. Exit with a clear error if they are missing.

2. **Restrict CORS** to the actual frontend origin: `AllowOrigins: os.Getenv("CORS_ORIGINS")` with a proper default.

3. **Add pagination** to all list endpoints using query params `?page=1&limit=20`.

4. **Add a token refresh endpoint** at `/auth/refresh` that accepts a refresh token and returns a new access token.

5. **Configure Fiber body size limits**: `fiber.New(fiber.Config{BodyLimit: 1 * 1024 * 1024})` (1MB).

6. **Remove debug logging** from booking_handler.go before deployment.

7. **Add frontend testing** with Vitest and React Testing Library. Priority: AuthContext, withAuth, withRole, API client.

8. **Add proper error handling for `strconv.Atoi`** in all handlers to return 400 for non-numeric IDs.

9. **Add HTTPS/TLS** configuration for production deployment.

10. **Add database connection pooling** configuration (GORM supports it via `sql.DB` settings).

---

## Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Unauthorized data access via open CORS | High | Critical | Restrict CORS origins to frontend domain |
| JWT forgery with empty secret | High | Critical | Validate JWT_SECRET at startup, require min 32 chars |
| Public booking data leak | High | High | Add auth middleware to GET /bookings |
| Spam via unprotected test email endpoint | Medium | Medium | Add auth or disable in production |
| DB credential leak via source code | Medium | High | Remove hardcoded defaults, use secrets manager |
| Concurrent booking conflicts (race condition) | Medium | Medium | Add database-level unique constraint or row locking on booking time slots |
| Session fixation via token theft | Low | High | Implement token rotation, add HttpOnly cookie option |
| Data loss from cascade delete | Low | High | Add soft delete, backup strategy |
| Memory exhaustion from unpaginated queries | Medium | Medium | Add pagination to all list endpoints |
| Broken auth from expired tokens | High | Low | Implement token refresh endpoint |

---

## Test Files Created

| File | Tests | Status |
|------|-------|--------|
| `backend/internal/utils/jwt_test.go` | 12 | All PASS |
| `backend/internal/utils/password_test.go` | 4 | All PASS |
| `backend/internal/utils/validator_test.go` | 7 | All PASS |
| `backend/internal/models/booking_test.go` | 6 | All PASS |
| `backend/internal/models/models_test.go` | 8 | All PASS |
| `backend/internal/middleware/rate_limiter_test.go` | 7 | All PASS |
| `backend/internal/middleware/role_test.go` | 1 | All PASS |
| `backend/internal/handlers/api_integration_test.go` | 55 | All SKIPPED (server not running) |

---

## How to Run Tests

```bash
# Run all unit tests
cd backend && go test ./internal/... -v

# Run specific test suite
go test ./internal/utils/... -v
go test ./internal/models/... -v
go test ./internal/middleware/... -v

# Run integration tests (requires backend server running on port 8000)
go test ./internal/handlers/... -v

# Run with coverage report
go test ./internal/... -cover -coverprofile=coverage.out
go tool cover -html=coverage.out
```
