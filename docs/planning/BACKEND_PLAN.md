# แผนการพัฒนา Backend - SU Booking Room System

## สรุป Requirements

ระบบจองห้องเรียนสำหรับภาควิชาคอมพิวเตอร์ มี 3 บทบาทผู้ใช้:

### 1. แอดมิน (Admin)
- จัดการข้อมูลตึก/ห้อง (CRUD)
- จองห้องแทนผู้อื่น (อาจารย์/บุคคลภายนอก/ภาคอื่น)
- ยกเลิกการจองพร้อมแจ้งเตือน
- จัดการตารางเรียนประจำ (ใส่มือ)
- ดูสถานะการจองทั้งหมด
- จองหลายวัน (ติดกัน/ไม่ติดกัน)
- ขออุปกรณ์เสริม + ช่อง "อื่นๆ"
- เลือกปริ้น/ไม่ปริ้นใบจอง
- ดูตารางการใช้ห้อง

### 2. อาจารย์ (Teacher)
- จองห้อง (ป้องกันการจองซ้ำ)
- จองวันเดียวหรือหลายวัน
- ระบุอุปกรณ์
- ดูตารางที่ตัวเองจอง
- ดูตารางการใช้ห้อง

### 3. ผู้เยี่ยมชม (Visitor)
- ดูตารางการใช้ห้อง (read-only)

---

## สถานะปัจจุบัน

### ✅ ทำแล้ว
- Database models ครบ 7 models (Role, User, Building, Room, Booking, FixedSchedule, Notification)
- Database connection (PostgreSQL + GORM)
- Auto migration
- Basic server setup (Fiber + CORS + Logger)
- Health check endpoint
- Docker support

### ❌ ยังไม่มี
- Authentication & Authorization (JWT, password hashing)
- ทุก CRUD endpoints
- Business logic (conflict checking, validation)
- Notification system
- Error handling middleware
- Input validation
- Tests

---

## แผนการพัฒนาแบ่งเป็น 9 ขั้นตอน

### Phase 1: Setup Dependencies & Basic Utils

#### 1.1 Setup Dependencies
เพิ่ม libraries ที่จำเป็น:
```bash
go get github.com/golang-jwt/jwt/v5
go get golang.org/x/crypto/bcrypt
go get github.com/go-playground/validator/v10
go get github.com/jung-kurt/gofpdf    # สำหรับสร้าง PDF (ใช้ทีหลัง)
```

#### 1.2 สร้าง Basic Utils
**ไฟล์**: `internal/utils/`
- `password.go` - HashPassword, ComparePassword (bcrypt)
- `jwt.go` - GenerateToken, ValidateToken, ExtractClaims
- `response.go` - StandardResponse, ErrorResponse, PaginatedResponse
- `validator.go` - Custom validators (email, time range, etc.)

---

### Phase 2: Middleware Setup

#### 2.1 สร้าง Middleware
**ไฟล์**: `internal/middleware/`
- `auth.go` - JWT authentication middleware
- `role.go` - Role-based authorization (AdminOnly, TeacherOrAdmin, etc.)
- `error.go` - Global error handler
- `logger.go` - Request/Response logging

---

### Phase 3: 🎯 Login & Register (ทำให้เสร็จก่อนทุกอย่าง!)

#### 3.1 สร้าง Auth System
**ไฟล์**:
- `internal/repositories/user_repository.go`
- `internal/services/auth_service.go`
- `internal/handlers/auth_handler.go`

#### 3.2 Auth Endpoints
**Endpoints สำคัญที่ต้องทำให้ใช้งานได้**:
```
POST /api/v1/auth/register    - ลงทะเบียน (admin สร้างให้)
POST /api/v1/auth/login       - เข้าสู่ระบบ ⭐ สำคัญที่สุด
GET  /api/v1/auth/me          - ดูข้อมูลตัวเอง (ต้อง login ก่อน)
```

**Endpoints เพิ่มเติม (ทำทีหลังได้)**:
```
POST /api/v1/auth/refresh     - Refresh token
PUT  /api/v1/auth/profile     - แก้ไขข้อมูลตัวเอง
PUT  /api/v1/auth/password    - เปลี่ยนรหัสผ่าน
```

#### 3.3 Seed Data สำหรับ Test
**ไฟล์**: `internal/seed/seeder.go`
- สร้าง default roles (admin, teacher, visitor)
- สร้าง admin user ตัวแรก สำหรับ login test
  ```
  Email: admin@silpakorn.edu
  Password: admin123
  Role: Admin
  ```

**🎯 เป้าหมาย Phase 3**: ทำให้ login/register ใช้งานได้ และ test ด้วย Postman/Thunder Client ให้ผ่านก่อน!

---

### Phase 4: User & Role Management (Admin เท่านั้น)

#### 4.1 Role Management
**ไฟล์**:
- `internal/handlers/role_handler.go`
- `internal/services/role_service.go`
- `internal/repositories/role_repository.go`

**Endpoints**:
```
GET    /api/v1/roles          - ดู roles ทั้งหมด
GET    /api/v1/roles/:id      - ดู role ตาม ID
POST   /api/v1/roles          - สร้าง role [Admin]
PUT    /api/v1/roles/:id      - แก้ไข role [Admin]
DELETE /api/v1/roles/:id      - ลบ role [Admin]
```

#### 4.2 User Management (CRUD)
**ไฟล์**:
- `internal/handlers/user_handler.go`
- `internal/services/user_service.go`
- (ใช้ repository จาก Phase 3)

**Endpoints**:
```
GET    /api/v1/users          - ดู users ทั้งหมด [Admin]
GET    /api/v1/users/:id      - ดู user ตาม ID [Admin]
POST   /api/v1/users          - สร้าง user [Admin]
PUT    /api/v1/users/:id      - แก้ไข user [Admin]
DELETE /api/v1/users/:id      - ลบ user [Admin]
```

---

### Phase 5: Building & Room Management

#### 5.1 Building Management
**ไฟล์**:
- `internal/handlers/building_handler.go`
- `internal/services/building_service.go`
- `internal/repositories/building_repository.go`

**Endpoints**:
```
GET    /api/v1/buildings          - ดู buildings ทั้งหมด [All]
GET    /api/v1/buildings/:id      - ดู building ตาม ID [All]
POST   /api/v1/buildings          - สร้าง building [Admin]
PUT    /api/v1/buildings/:id      - แก้ไข building [Admin]
DELETE /api/v1/buildings/:id      - ลบ building [Admin]
```

#### 5.2 Room Management
**ไฟล์**:
- `internal/handlers/room_handler.go`
- `internal/services/room_service.go`
- `internal/repositories/room_repository.go`

**Endpoints**:
```
GET    /api/v1/rooms                     - ดู rooms ทั้งหมด [All]
GET    /api/v1/rooms/:id                 - ดู room ตาม ID [All]
GET    /api/v1/buildings/:id/rooms       - ดู rooms ในตึก [All]
POST   /api/v1/rooms                     - สร้าง room [Admin]
PUT    /api/v1/rooms/:id                 - แก้ไข room [Admin]
DELETE /api/v1/rooms/:id                 - ลบ room [Admin]
GET    /api/v1/rooms/:id/availability    - ตรวจสอบความว่าง [All]
```

---

### Phase 6: Fixed Schedule Management

**ไฟล์**:
- `internal/handlers/fixed_schedule_handler.go`
- `internal/services/fixed_schedule_service.go`
- `internal/repositories/fixed_schedule_repository.go`

**Endpoints**:
```
GET    /api/v1/schedules               - ดู schedules ทั้งหมด [All]
GET    /api/v1/schedules/:id           - ดู schedule ตาม ID [All]
GET    /api/v1/rooms/:id/schedules     - ดู schedules ของห้อง [All]
POST   /api/v1/schedules               - สร้าง schedule [Admin]
PUT    /api/v1/schedules/:id           - แก้ไข schedule [Admin]
DELETE /api/v1/schedules/:id           - ลบ schedule [Admin]
POST   /api/v1/schedules/bulk          - สร้างหลาย schedules [Admin]
```

**Business Logic**:
- ป้องกันการสร้าง schedule ซ้ำกับห้องเดียวกัน วัน/เวลาเดียวกัน
- Validate DayOfWeek (1-7)
- Validate StartTime < EndTime

---

### Phase 7: Booking Management (Core Feature)

**ไฟล์**:
- `internal/handlers/booking_handler.go`
- `internal/services/booking_service.go`
- `internal/repositories/booking_repository.go`

#### 7.1 Booking CRUD
**Endpoints**:
```
GET    /api/v1/bookings                 - ดู bookings ทั้งหมด [Admin]
GET    /api/v1/bookings/my              - ดู bookings ของตัวเอง [Teacher/Admin]
GET    /api/v1/bookings/:id             - ดู booking ตาม ID [Owner/Admin]
POST   /api/v1/bookings                 - สร้าง booking [Teacher/Admin]
POST   /api/v1/bookings/multiple        - จองหลายวัน [Teacher/Admin]
PUT    /api/v1/bookings/:id             - แก้ไข booking [Owner/Admin]
DELETE /api/v1/bookings/:id             - ยกเลิก booking [Owner/Admin]
```

#### 7.2 Booking Approval (Admin only)
**Endpoints**:
```
PUT    /api/v1/bookings/:id/approve     - อนุมัติ [Admin]
PUT    /api/v1/bookings/:id/reject      - ปฏิเสธ [Admin]
PUT    /api/v1/bookings/:id/cancel      - ยกเลิก [Admin]
```

#### 7.3 Booking Queries
**Endpoints**:
```
GET    /api/v1/rooms/:id/bookings              - ดู bookings ของห้อง [All]
GET    /api/v1/rooms/:id/bookings/date/:date   - ดู bookings ตามวัน [All]
GET    /api/v1/bookings/date-range             - ดู bookings ช่วงเวลา [All]
GET    /api/v1/bookings/calendar/:month        - Calendar view [All]
```

#### 7.4 Booking Approval Workflow

**Status Flow**:
```
pending → approved/rejected (by Admin)
approved/pending → cancelled (by Admin/Owner)
approved → completed (auto, หลังเวลาจองผ่านไป)
```

**กฎสำคัญ**:
- ทุกการจอง (ทั้ง Teacher และ Admin จองให้) เริ่มที่ status = 'pending'
- **ต้องอนุมัติทุกครั้ง** โดย Admin ก่อนใช้งานได้
- เฉพาะ bookings ที่ status = 'approved' เท่านั้นที่จะ block ตารางห้อง
- Pending bookings ไม่ block แต่ต้องแสดงในตารางให้เห็น (สีต่างกัน)

#### 7.5 Business Logic สำคัญ
**ใน `booking_service.go`**:

1. **CheckConflict()** - ตรวจสอบการจองซ้ำ
   - ตรวจกับ bookings ที่ status = **approved เท่านั้น** (pending ไม่ block)
   - ตรวจกับ fixed_schedules
   - คำนวณ time overlap: `(new_start < existing_end) AND (new_end > existing_start)`

2. **CreateMultipleBookings()** - จองหลายวัน
   - **รับ array of dates**: `["2024-01-01", "2024-01-05", "2024-01-10"]`
   - สร้าง booking แยกกันแต่ละวัน (แต่ละ record)
   - ใช้ same time, room, equipment สำหรับทุกวัน
   - **Validate ทุกวันก่อน commit** (ใช้ transaction)
   - ถ้าวันใดวันหนึ่ง conflict → rollback ทั้งหมด
   - Return array ของ booking_ids ที่สร้างสำเร็จ

3. **ApproveBooking()** - อนุมัติการจอง (Admin เท่านั้น)
   - Update status → 'approved'
   - สร้าง notification แจ้งผู้จอง
   - Re-check conflict ก่อนอนุมัติ (เผื่อมีคนอนุมัติอันอื่นไปก่อน)

4. **RejectBooking()** - ปฏิเสธการจอง (Admin เท่านั้น)
   - Update status → 'rejected'
   - บันทึก StatusNote (เหตุผล - required)
   - สร้าง notification แจ้งผู้จอง

5. **CancelBooking()** - ยกเลิกการจอง (Admin หรือ Owner)
   - Update status → 'cancelled'
   - บันทึก StatusNote
   - สร้าง notification แจ้งผู้จอง (ถ้า Admin เป็นคนยกเลิก)

6. **AutoCompleteBookings()** - อัพเดทสถานะอัตโนมัติ
   - เปลี่ยน status จาก approved → completed หลังเวลาจองผ่านไป
   - รัน cronjob หรือ trigger on query

7. **ValidateEquipmentRequest()** - Validate ข้อมูลอุปกรณ์
   - เป็น text field ธรรมดา (ไม่มี master data)
   - ไม่บังคับ (optional)

---

### Phase 8: Notification System

**ไฟล์**:
- `internal/handlers/notification_handler.go`
- `internal/services/notification_service.go`
- `internal/repositories/notification_repository.go`

**Endpoints**:
```
GET    /api/v1/notifications           - ดู notifications ของตัวเอง [Auth]
GET    /api/v1/notifications/:id       - ดู notification ตาม ID [Auth]
PUT    /api/v1/notifications/:id/read  - ทำเครื่องหมายอ่านแล้ว [Auth]
PUT    /api/v1/notifications/read-all  - ทำเครื่องหมายอ่านทั้งหมด [Auth]
DELETE /api/v1/notifications/:id       - ลบ notification [Auth]
```

**Notification Types & Triggers**:

| Event | Type | Message | Recipient |
|-------|------|---------|-----------|
| สร้างการจอง | `booking_created` | "การจองของคุณถูกสร้างแล้ว รอการอนุมัติ" | ผู้จอง |
| อนุมัติ | `booking_approved` | "การจองของคุณได้รับการอนุมัติแล้ว" | ผู้จอง |
| ปฏิเสธ | `booking_rejected` | "การจองของคุณถูกปฏิเสธ: {เหตุผล}" | ผู้จอง |
| ยกเลิก (by Admin) | `booking_cancelled` | "การจองของคุณถูกยกเลิก: {เหตุผล}" | ผู้จอง |
| แจ้งเตือน (optional) | `booking_reminder` | "การจองของคุณจะเริ่มใน 1 ชั่วโมง" | ผู้จอง |

**Implementation**:
- สร้าง notification **ทันที** เมื่อมี state change
- เก็บแค่ใน database (ไม่มี email/SMS ในระยะแรก)
- Helper function: `CreateNotification(userID, bookingID, type, message string)`
- Integration points:
  - `CreateBooking()` → booking_created
  - `ApproveBooking()` → booking_approved
  - `RejectBooking()` → booking_rejected
  - `CancelBooking()` → booking_cancelled (เฉพาะ Admin ยกเลิก)

---

### Phase 9: Additional Features

#### 9.1 Print Booking Feature (PDF Generation)
**Endpoint**:
```
GET    /api/v1/bookings/:id/print      - Generate PDF ใบจอง [Owner/Admin]
```

**Implementation**:
- **ใช้ gofpdf library** สร้าง PDF ใน backend
- Return PDF file (Content-Type: application/pdf)
- Layout ใบจอง:
  - Header: "ใบจองห้อง - ภาควิชาคอมพิวเตอร์ มหาวิทยาลัยศิลปากร"
  - ข้อมูลการจอง:
    - เลขที่การจอง (Booking ID)
    - ชื่อผู้จอง (Fullname)
    - ห้อง / ตึก
    - วันที่-เวลา
    - หัวเรื่อง / รายละเอียด
    - อุปกรณ์ที่ต้องการ
    - สถานะ
  - Footer: วันที่พิมพ์, ลายเซ็นผู้อนุมัติ (optional)

**ไฟล์**:
- `internal/utils/pdf.go` - PDF generator utility
- `internal/handlers/booking_handler.go` - เพิ่ม PrintBooking handler

**Note**:
- สามารถปริ้นได้เฉพาะ booking ที่ status = approved หรือ completed
- ถ้า pending/rejected → return error

#### 9.2 Statistics & Reports (Admin)
**Endpoints**:
```
GET    /api/v1/stats/bookings          - สถิติการจอง [Admin]
GET    /api/v1/stats/rooms/usage       - สถิติการใช้ห้อง [Admin]
GET    /api/v1/stats/users/activity    - สถิติผู้ใช้งาน [Admin]
```

#### 9.3 Search & Filter
เพิ่ม query parameters ใน existing endpoints:
- `?search=keyword` - ค้นหาชื่อห้อง, ตึก, ผู้จอง
- `?status=pending,approved` - กรองตาม status
- `?date_from=2024-01-01&date_to=2024-12-31` - กรองตามวัน
- `?room_id=1` - กรองตามห้อง
- `?building_id=1` - กรองตามตึก
- `?page=1&limit=20` - Pagination

#### 9.4 Seed Data (Optional)
**ไฟล์**: `internal/seed/seeder.go`
- สร้าง default roles (admin, teacher, visitor)
- สร้าง admin user ตัวแรก
- สร้างข้อมูลตัวอย่าง (buildings, rooms) สำหรับ development

---

### Phase 10: Testing & Documentation

#### 10.1 Unit Tests
สร้าง tests สำหรับ:
- Utils (password, jwt, validation)
- Services (business logic)
- Repositories (database operations)

**ตัวอย่างไฟล์**:
- `internal/services/booking_service_test.go`
- `internal/utils/password_test.go`

#### 10.2 Integration Tests
- API endpoint tests
- Database integration tests

#### 10.3 API Documentation
สร้างไฟล์:
- `docs/API.md` - รายละเอียด endpoints ทั้งหมด
- `docs/AUTHENTICATION.md` - วิธีใช้งาน auth
- หรือใช้ Swagger/OpenAPI spec

---

## ลำดับการทำงานที่แนะนำ

### ลำดับที่ 1 (Must Have - ก่อน launch)
1. ✅ **Phase 1**: Setup Dependencies & Utils
2. ✅ **Phase 2**: Middleware Setup
3. ✅ **Phase 3**: 🎯 Login & Register (ทำให้เสร็จก่อนทุกอย่าง!)
4. ✅ **Phase 4**: User & Role Management
5. ✅ **Phase 5**: Building & Room Management
6. ✅ **Phase 6**: Fixed Schedule Management
7. ✅ **Phase 7**: Booking Management (ทุกส่วน)
8. ✅ **Phase 8**: Notification System

### ลำดับที่ 2 (Should Have - หลัง launch)
9. 🔄 **Phase 9**: Print, Statistics, Advanced Search
10. 🔄 **Phase 10**: Tests & Documentation

### ลำดับที่ 3 (Nice to Have - future)
- Export bookings (Excel, CSV)
- Email notifications
- SMS notifications
- Mobile app support
- Calendar integration (Google Calendar, Outlook)
- QR code สำหรับเช็คอิน
- Analytics dashboard

---

## โครงสร้าง Response Format มาตรฐาน

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": [ ... ]
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

---

## Environment Variables ที่ต้องเพิ่ม

```env
# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=168h

# Password
BCRYPT_COST=10

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

---

## ไฟล์สำคัญที่ต้องสร้าง/แก้ไข

### ไฟล์ใหม่ (ประมาณ 50+ ไฟล์)

**Utils** (5 ไฟล์):
- `internal/utils/password.go`
- `internal/utils/jwt.go`
- `internal/utils/response.go`
- `internal/utils/validator.go`
- `internal/utils/pagination.go`

**Middleware** (4 ไฟล์):
- `internal/middleware/auth.go`
- `internal/middleware/role.go`
- `internal/middleware/error.go`
- `internal/middleware/logger.go`

**Repositories** (7 ไฟล์):
- `internal/repositories/user_repository.go`
- `internal/repositories/role_repository.go`
- `internal/repositories/building_repository.go`
- `internal/repositories/room_repository.go`
- `internal/repositories/booking_repository.go`
- `internal/repositories/fixed_schedule_repository.go`
- `internal/repositories/notification_repository.go`

**Services** (7 ไฟล์):
- `internal/services/auth_service.go`
- `internal/services/user_service.go`
- `internal/services/role_service.go`
- `internal/services/building_service.go`
- `internal/services/room_service.go`
- `internal/services/booking_service.go`
- `internal/services/fixed_schedule_service.go`
- `internal/services/notification_service.go`

**Handlers** (7 ไฟล์):
- `internal/handlers/auth_handler.go`
- `internal/handlers/user_handler.go`
- `internal/handlers/role_handler.go`
- `internal/handlers/building_handler.go`
- `internal/handlers/room_handler.go`
- `internal/handlers/booking_handler.go`
- `internal/handlers/fixed_schedule_handler.go`
- `internal/handlers/notification_handler.go`

**Other**:
- `internal/seed/seeder.go`
- `.env` (update)

### ไฟล์ที่ต้องแก้ไข

- `internal/routes/routes.go` - เพิ่ม routes ทั้งหมด
- `main.go` - เพิ่ม middleware
- `go.mod` - เพิ่ม dependencies

---

## Tips & Best Practices

### 1. Error Handling
```go
// สร้าง custom errors
type AppError struct {
    Code    string
    Message string
    Details interface{}
}
```

### 2. Database Transactions
```go
// ใช้ transaction สำหรับ operations ที่ซับซ้อน
tx := config.DB.Begin()
// ... operations ...
tx.Commit() // or tx.Rollback()
```

### 3. Validation
```go
// ใช้ struct tags
type CreateBookingRequest struct {
    RoomID    int    `json:"room_id" validate:"required"`
    Title     string `json:"title" validate:"required,min=3,max=255"`
    StartTime string `json:"start_time" validate:"required"`
}
```

### 4. Password Security
```go
// ห้าม log password
// ใช้ bcrypt cost ≥ 10
// Hash ก่อน save เสมอ
```

### 5. JWT Best Practices
```go
// เก็บ user_id, role_id ใน claims
// ใช้ expiry time สั้นๆ
// Implement refresh token
```

### 6. Booking Conflict Logic
```go
// Algorithm สำคัญ:
// 1. Check fixed schedule first
// 2. Check existing bookings
// 3. Use SQL queries with time overlap logic:
//    (new_start < existing_end) AND (new_end > existing_start)
```

---

## สรุป

แผนนี้ครอบคลุม:
- ✅ Authentication & Authorization (JWT + bcrypt)
- ✅ Approval Workflow (ต้องอนุมัติทุกครั้ง)
- ✅ ทุก CRUD operations (7 resources)
- ✅ Business logic สำคัญทั้งหมด
- ✅ Conflict checking (approved bookings + fixed schedules)
- ✅ Notification system (5 types)
- ✅ Multi-day booking (array of dates)
- ✅ Equipment request (text field)
- ✅ Print booking (PDF generation)
- ✅ Role-based access control (3 roles)

**จำนวนงานโดยประมาณ**:
- ~55 ไฟล์ใหม่ (utils, middleware, repositories, services, handlers)
- ~65 endpoints
- ~3,500-5,500 บรรทัดโค้ด

**เวลาที่คาดการณ์** (สำหรับ developer 1 คน):
- Phase 1-2: 3-4 วัน (Auth + User management)
- Phase 3-4: 2-3 วัน (Building/Room + Fixed schedules)
- Phase 5: 5-6 วัน (Booking - ซับซ้อนที่สุด)
- Phase 6: 2 วัน (Notifications)
- Phase 7: 2-3 วัน (Print PDF + Stats)
- Phase 8: 2-3 วัน (Tests + Docs)
- **รวม**: 16-21 วันทำงาน

---

## Quick Reference: Implementation Checklist

### 🔴 Critical Path (ต้องทำก่อน launch)

**Week 1: Foundation + Login/Register**
- [ ] Phase 1: Setup Dependencies & Utils (password, jwt, response, validator)
- [ ] Phase 2: Middleware (auth, role, error, logger)
- [ ] Phase 3: 🎯 Login & Register (ต้องทำให้ใช้งานได้และ test ให้ผ่าน!)
- [ ] Phase 4: User & Role Management

**Week 2: Resources**
- [ ] Phase 5: Building & Room Management
- [ ] Phase 6: Fixed Schedule Management
- [ ] Phase 7.1-7.3: Booking CRUD + Queries

**Week 3: Booking Logic**
- [ ] Phase 7.4-7.5: Approval Workflow + Business Logic
- [ ] Phase 8: Notification System
- [ ] Phase 9.1: PDF Generation

**Week 4 (Optional):**
- [ ] Phase 9.2-9.3: Statistics + Search/Filter
- [ ] Phase 10: Tests + Documentation

### 🟡 Nice to Have (หลัง launch)
- Seed data
- Advanced statistics
- Email notifications
- Export to Excel

---

## คำแนะนำสำคัญในการ Implement

### 1. เริ่มจาก Foundation
```
Utils → Middleware → Auth → Resources
```
ห้ามข้ามขั้นตอน เพราะทุกส่วนพึ่งพากัน

### 2. ใช้ Transaction สำหรับ Multi-day Booking
```go
tx := config.DB.Begin()
for _, date := range dates {
    // create booking
}
tx.Commit() // หรือ tx.Rollback() ถ้า error
```

### 3. Conflict Check Algorithm
```sql
SELECT COUNT(*) FROM bookings
WHERE room_id = ?
  AND booking_date = ?
  AND status = 'approved'
  AND (
    (start_time < ? AND end_time > ?) OR
    (start_time < ? AND end_time > ?)
  )
```

### 4. Status Validation ทุกจุด
```go
// ใช้ constants
const (
    StatusPending   = "pending"
    StatusApproved  = "approved"
    StatusRejected  = "rejected"
    StatusCancelled = "cancelled"
    StatusCompleted = "completed"
)
```

### 5. PDF Generation
```go
pdf := gofpdf.New("P", "mm", "A4", "")
pdf.AddPage()
// Add content...
return pdf.Output()
```

### 6. Notification Pattern
```go
func (s *BookingService) ApproveBooking(id int) error {
    // 1. Update booking
    // 2. Create notification
    s.notificationService.Create(userID, bookingID, "booking_approved", "...")
    return nil
}
```

---

## 🚀 เริ่มต้น Implementation

ควรเริ่มจาก **Phase 1 → Phase 2 → Phase 3 (Login/Register)** และทำตามลำดับ เพราะแต่ละ phase พึ่งพาอันก่อนหน้า

**🎯 Milestone แรก**: หลังจบ Phase 3 ต้องสามารถ login/register ได้ และ test ผ่าน!

**หากมีคำถามเพิ่มเติมระหว่าง implement สามารถถามได้เลย!**
