# 🎓 SU Booking Room - คู่มือสำหรับ Claude AI

> ระบบจองห้องเรียนมหาวิทยาลัย พัฒนาด้วย **Next.js + Go Fiber**
> **โครงสร้างแบบง่าย** เหมาะสำหรับนักศึกษาและผู้เริ่มต้นเรียนรู้

---

## 📌 หลักการสำคัญ

### 1. **โค้ดต้องเข้าใจง่าย ไม่ซับซ้อน**
- ตั้งชื่อตัวแปร**ไม่ต้องละเอียดเกินไป** ให้เข้าใจง่าย เช่น `user`, `booking`, `room`
- ใช้โครงสร้างแบบ **2-layer MVC** (Handler → Database) เหมือน Express.js
- **ไม่ใช้ DDD, Clean Architecture** หรือ pattern ซับซ้อน
- เหมาะสำหรับ**นักศึกษามหาวิทยาลัยฝึกเขียน**

### 2. **การตั้งชื่อตัวแปรและฟังก์ชัน**

#### ✅ ตัวอย่างที่ดี (Simple & Clear)
```go
// Backend (Go)
user := models.User{}
h.DB.Find(&user)

bookings := []models.Booking{}
room := models.Room{}
```

```typescript
// Frontend (TypeScript)
const user = await authApi.getMe()
const bookings = await bookingApi.getMyBookings()
const rooms = await roomApi.getAll()
```

#### ❌ ตัวอย่างที่ซับซ้อนเกินไป (หลีกเลี่ยง)
```go
// ไม่ต้องซับซ้อนแบบนี้
userRepositoryImplementation := repositories.NewUserRepository(db)
userServiceWithDependencyInjection := services.NewUserService(userRepositoryImplementation)
```

### 3. **โครงสร้างโปรเจกต์แบบง่าย**

```
Backend:  Handler → Database (ไม่ต้องผ่าน Service/Repository)
Frontend: Page → API Client → Backend
```

---

## 🏗️ โครงสร้างโปรเจกต์

### Backend (Go + Fiber)

```
backend/
├── main.go                          # จุดเริ่มต้นโปรแกรม
├── internal/
│   ├── handlers/                    # Controllers (เหมือน Express.js)
│   │   ├── auth_handler.go          # Login, Register, GetMe
│   │   ├── booking_handler.go       # การจองห้อง CRUD
│   │   ├── building_handler.go      # อาคาร CRUD
│   │   ├── room_handler.go          # ห้อง CRUD
│   │   ├── seed_handler.go          # สร้างข้อมูลทดสอบ
│   │   └── health_handler.go        # Health check
│   │
│   ├── models/                      # Database Models (GORM)
│   │   ├── users.go                 # ผู้ใช้
│   │   ├── role.go                  # บทบาท (Admin, Teacher, Visitor)
│   │   ├── building.go              # อาคาร
│   │   ├── room.go                  # ห้อง
│   │   ├── booking.go               # การจอง
│   │   ├── fixed_schedule.go        # ตารางเรียนประจำ
│   │   └── notification.go          # การแจ้งเตือน
│   │
│   ├── routes/                      # Route definitions
│   │   └── routes.go                # กำหนด endpoints ทั้งหมด
│   │
│   ├── middleware/                  # Middleware functions
│   │   ├── auth.go                  # JWT authentication
│   │   ├── role.go                  # Role-based access control
│   │   ├── error.go                 # Error handling
│   │   └── logger.go                # Request logging
│   │
│   ├── utils/                       # Helper functions
│   │   ├── jwt.go                   # JWT token
│   │   ├── password.go              # Password hashing (bcrypt)
│   │   ├── response.go              # Standard responses
│   │   └── validator.go             # Validation
│   │
│   ├── config/                      # Configuration
│   │   └── database.go              # Database connection (GORM + PostgreSQL)
│   │
│   └── seed/                        # Database seeder
│       └── seeder.go                # สร้าง roles และ admin เริ่มต้น
│
├── fix_booking_time_columns.sql    # SQL fix สำหรับ booking time columns
├── reset_db.sql                     # Reset database script
└── SEED_API_GUIDE.md                # คู่มือใช้งาน Seed API
```

### Frontend (Next.js + TypeScript)

```
frontend/
├── src/
│   ├── app/                         # Next.js 14 App Router
│   │   ├── page.tsx                 # หน้าแรก (รายการอาคาร)
│   │   ├── login/page.tsx           # หน้า Login
│   │   ├── register/page.tsx        # หน้าสมัครสมาชิก
│   │   ├── profile/page.tsx         # หน้าโปรไฟล์
│   │   ├── booking/page.tsx         # หน้าจองห้อง (แสดงตารางเรียนและการจองที่มีอยู่)
│   │   ├── my-bookings/page.tsx     # หน้ารายการจองของฉัน
│   │   ├── building/[id]/page.tsx   # หน้ารายละเอียดอาคาร
│   │   └── admin/                   # หน้าจัดการระบบ (Admin only)
│   │       ├── buildings/page.tsx   # จัดการอาคาร
│   │       ├── rooms/page.tsx       # จัดการห้อง
│   │       ├── schedules/page.tsx   # จัดการตารางเรียนประจำ
│   │       └── bookings/page.tsx    # จัดการการจอง (อนุมัติ/ปฏิเสธ)
│   │
│   ├── components/                  # React Components
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx       # Layout หลัก
│   │   │   ├── Header.tsx           # Header + Navigation
│   │   │   └── Sidebar.tsx          # Sidebar menu
│   │   └── admin/                   # Admin components
│   │       ├── BuildingFormModal.tsx
│   │       ├── RoomFormModal.tsx
│   │       ├── ScheduleFormModal.tsx
│   │       └── DeleteConfirmModal.tsx
│   │
│   ├── contexts/                    # React Contexts
│   │   └── AuthContext.tsx          # Authentication context
│   │
│   ├── lib/                         # Libraries & Utilities
│   │   ├── api/                     # API Client
│   │   │   ├── client.ts            # HTTP client + API functions
│   │   │   └── types.ts             # TypeScript types/interfaces
│   │   ├── withAuth.tsx             # HOC สำหรับ authentication
│   │   └── withRole.tsx             # HOC สำหรับ role-based access
│   │
│   └── styles/                      # CSS/Tailwind configs
│       └── globals.css              # Global styles
│
└── package.json                     # Dependencies
```

---

## 🎯 แนวทางการเขียนโค้ด

### Backend (Go + Fiber)

#### 1. Handler Pattern (แบบง่าย)

```go
// internal/handlers/booking_handler.go
type BookingHandler struct {
    DB *gorm.DB  // เชื่อมตรงกับ database (ไม่ผ่าน service/repository)
}

// GetAll - ดูการจองทั้งหมด (Admin only)
func (h *BookingHandler) GetAll(c *fiber.Ctx) error {
    var bookings []models.Booking

    // Query ตรงจาก database
    if err := h.DB.Find(&bookings).Error; err != nil {
        return utils.InternalServerErrorResponse(c, err.Error())
    }

    return utils.StandardResponse(c, fiber.StatusOK, bookings, "Success")
}

// Create - สร้างการจองใหม่
func (h *BookingHandler) Create(c *fiber.Ctx) error {
    var input models.Booking

    // 1. Parse request body
    if err := c.BodyParser(&input); err != nil {
        return utils.BadRequestResponse(c, "Invalid request body")
    }

    // 2. Validate required fields
    if input.RoomID == 0 || input.Title == "" {
        return utils.BadRequestResponse(c, "Missing required fields")
    }

    // 3. ตรวจสอบว่าเวลาไม่ซ้อนทับ
    var conflictCount int64
    h.DB.Model(&models.Booking{}).
        Where("room_id = ? AND booking_date = ? AND status IN (?, ?)",
              input.RoomID, input.BookingDate, "pending", "approved").
        Where("start_time < ? AND end_time > ?", input.EndTime, input.StartTime).
        Count(&conflictCount)

    if conflictCount > 0 {
        return utils.ConflictResponse(c, "Time slot is already booked")
    }

    // 4. บันทึกลงฐานข้อมูล
    if err := h.DB.Create(&input).Error; err != nil {
        return utils.InternalServerErrorResponse(c, err.Error())
    }

    return utils.StandardResponse(c, fiber.StatusCreated, input, "Booking created successfully")
}
```

#### 2. Model Pattern (GORM)

```go
// internal/models/booking.go
type Booking struct {
    BookingID        int       `gorm:"primaryKey;autoIncrement" json:"booking_id"`
    UserID           int       `gorm:"not null;index" json:"user_id"`
    RoomID           int       `gorm:"not null;index" json:"room_id"`
    Title            string    `gorm:"type:varchar(255);not null" json:"title"`
    Detail           string    `gorm:"type:text" json:"detail"`
    BookingDate      time.Time `gorm:"type:date;not null" json:"booking_date"`
    StartTime        string    `gorm:"type:time;not null" json:"start_time"`
    EndTime          string    `gorm:"type:time;not null" json:"end_time"`
    Status           string    `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
    CreatedAt        time.Time `gorm:"default:now()" json:"created_at"`
    UpdatedAt        time.Time `gorm:"default:now()" json:"updated_at"`
}
```

#### 3. Response Helper

```go
// internal/utils/response.go

// Success response
utils.StandardResponse(c, statusCode, data, message)

// Error responses
utils.BadRequestResponse(c, "Invalid input")
utils.UnauthorizedResponse(c, "Missing token")
utils.ForbiddenResponse(c, "No permission")
utils.NotFoundResponse(c, "Not found")
utils.ConflictResponse(c, "Time slot conflict")
utils.InternalServerErrorResponse(c, err.Error())
```

### Frontend (React + TypeScript)

#### 1. API Client Pattern

```typescript
// src/lib/api/client.ts
export const bookingApi = {
  // Get all bookings (Admin only)
  getAll: async (params?: {
    status?: string
    room_id?: number
    date?: string
  }): Promise<ApiResponse<Booking[]>> => {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.room_id) queryParams.append('room_id', params.room_id.toString())
    if (params?.date) queryParams.append('date', params.date)

    const query = queryParams.toString()
    return apiCall(`/bookings${query ? `?${query}` : ''}`)
  },

  // Create new booking
  create: async (data: CreateBookingRequest): Promise<ApiResponse<Booking>> => {
    return apiCall('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}
```

#### 2. Page Component Pattern

```typescript
// src/app/booking/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { bookingApi, roomApi } from '@/lib/api/client';

function BookingPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      await bookingApi.create(formData);
      // Success - redirect to my bookings
      router.push('/my-bookings');
    } catch (err: any) {
      setError(err?.error?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
      </form>
    </MainLayout>
  );
}

export default withAuth(BookingPage);
```

#### 3. Authentication HOC

```typescript
// src/lib/withAuth.tsx - ป้องกันหน้าที่ต้อง login
export function withAuth<P extends object>(Component: ComponentType<P>) {
  return function ProtectedComponent(props: P) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/login'); // Redirect ไป login
      }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading || !isAuthenticated) {
      return <div>Loading...</div>;
    }

    return <Component {...props} />;
  };
}

// src/lib/withRole.tsx - ป้องกันหน้าตาม role
export function withRole<P extends object>(
  Component: ComponentType<P>,
  allowedRoles: RoleName[]
) {
  return function ProtectedByRole(props: P) {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user && !allowedRoles.includes(user.role.name)) {
        router.push('/?error=forbidden'); // ไม่มีสิทธิ์
      }
    }, [isAuthenticated, user, router]);

    // Check permission
    if (!user || !allowedRoles.includes(user.role.name as RoleName)) {
      return null;
    }

    return <Component {...props} />;
  };
}

// ตัวอย่างการใช้งาน
export default withRole(AdminBuildingsPage, ['admin']); // เฉพาะ admin
export default withAuth(BookingPage); // ต้อง login
```

---

## 📊 Database Schema

### Users & Roles
```sql
roles (
  role_id    SERIAL PRIMARY KEY,
  name       VARCHAR(50),  -- 'admin', 'teacher', 'visitor'
  description TEXT
)

users (
  user_id    SERIAL PRIMARY KEY,
  email      VARCHAR(255) UNIQUE,
  username   VARCHAR(100),
  password   VARCHAR(255), -- bcrypt hashed
  fullname   VARCHAR(255),
  role_id    INTEGER → roles.role_id
)
```

### Buildings & Rooms
```sql
buildings (
  building_id SERIAL PRIMARY KEY,
  name        VARCHAR(255),
  description TEXT
)

rooms (
  room_id     SERIAL PRIMARY KEY,
  building_id INTEGER → buildings.building_id,
  name        VARCHAR(255),
  capacity    INTEGER,
  description TEXT
)
```

### Schedules & Bookings
```sql
fixed_schedules (
  schedule_id  SERIAL PRIMARY KEY,
  room_id      INTEGER → rooms.room_id,
  subject      VARCHAR(255),
  teacher_name VARCHAR(255),
  day_of_week  INTEGER,  -- 1=Mon, 2=Tue, ..., 7=Sun
  start_time   TIME,
  end_time     TIME,
  semester     VARCHAR(20)
)

bookings (
  booking_id        SERIAL PRIMARY KEY,
  user_id           INTEGER → users.user_id,
  room_id           INTEGER → rooms.room_id,
  title             VARCHAR(255),
  detail            TEXT,
  equipment_request TEXT,
  booking_date      DATE,
  start_time        TIME,
  end_time          TIME,
  status            VARCHAR(20),  -- 'pending', 'approved', 'rejected', 'cancelled'
  status_note       TEXT,
  created_at        TIMESTAMP,
  updated_at        TIMESTAMP
)
```

---

## 🔐 Authentication & Authorization

### JWT Token Flow
```
1. User login → Backend validates → Generate JWT tokens
2. Frontend stores tokens in localStorage
3. Every API request includes: Authorization: Bearer <token>
4. Backend middleware validates token → Extract user_id, role_id
5. Check permissions (role-based access control)
```

### Role-Based Access Control (RBAC)

```go
// backend/internal/middleware/role.go
const (
    RoleAdmin   = 1  // จัดการระบบทั้งหมด
    RoleTeacher = 2  // จองห้อง, ดูการจองตัวเอง
    RoleVisitor = 3  // ดูข้อมูลอย่างเดียว (read-only)
)

func AdminOnly(c *fiber.Ctx) error {
    roleID, ok := GetRoleID(c)
    if !ok || roleID != RoleAdmin {
        return utils.ForbiddenResponse(c, "Admin access required")
    }
    return c.Next()
}
```

### Protected Routes Example

```go
// backend/internal/routes/routes.go
bookings := api.Group("/bookings", middleware.AuthMiddleware)
bookings.Get("/my", bookingHandler.GetMyBookings)          // User
bookings.Post("/", bookingHandler.Create)                  // User
bookings.Get("/", middleware.AdminOnly, bookingHandler.GetAll)  // Admin only
```

---

## 🚀 API Endpoints

### Authentication
```
POST   /api/v1/auth/login        - Login (Public)
POST   /api/v1/auth/register     - Register (Public)
GET    /api/v1/auth/me           - Get current user (Auth required)
```

### Buildings
```
GET    /api/v1/buildings         - List all buildings (Public)
GET    /api/v1/buildings/:id     - Get building details (Public)
POST   /api/v1/buildings         - Create building (Admin only)
PUT    /api/v1/buildings/:id     - Update building (Admin only)
DELETE /api/v1/buildings/:id     - Delete building (Admin only)
```

### Rooms
```
GET    /api/v1/rooms                    - List all rooms (Public)
GET    /api/v1/rooms/:id                - Get room details (Public)
GET    /api/v1/buildings/:id/rooms      - Get rooms in building (Public)
GET    /api/v1/rooms/:id/availability   - Get room availability (Public)
POST   /api/v1/rooms                    - Create room (Admin only)
PUT    /api/v1/rooms/:id                - Update room (Admin only)
DELETE /api/v1/rooms/:id                - Delete room (Admin only)
```

### Fixed Schedules
```
GET    /api/v1/schedules                - List all schedules (Public)
GET    /api/v1/schedules/:id            - Get schedule details (Public)
GET    /api/v1/rooms/:id/schedules      - Get room schedules (Public)
POST   /api/v1/schedules                - Create schedule (Admin only)
POST   /api/v1/schedules/bulk           - Bulk create schedules (Admin only)
PUT    /api/v1/schedules/:id            - Update schedule (Admin only)
DELETE /api/v1/schedules/:id            - Delete schedule (Admin only)
```

### Bookings
```
GET    /api/v1/bookings/my              - Get my bookings (User)
GET    /api/v1/bookings/:id             - Get booking details (User/Admin)
POST   /api/v1/bookings                 - Create booking (User)
DELETE /api/v1/bookings/:id/cancel      - Cancel own booking (User)
GET    /api/v1/bookings                 - Get all bookings (Admin only)
PATCH  /api/v1/bookings/:id/status      - Update booking status (Admin only)
DELETE /api/v1/bookings/:id             - Delete booking (Admin only)
```

### Seed Data (Admin only)
```
POST   /api/v1/seed/all                 - Create mock data
DELETE /api/v1/seed/clear               - Clear all data (except users)
```

---

## 🛠️ การพัฒนาและแก้ไขบั๊ก

### ปัญหาที่เคยพบและแก้ไข

#### 1. **Bug: Time Overlap Detection ผิด**
**ปัญหา:** Logic การตรวจสอบเวลาซ้อนทับไม่ถูกต้อง
```go
// ❌ Logic เดิม (ผิด)
Where("(start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?) OR ...",
    input.EndTime, input.StartTime,
    input.EndTime, input.EndTime,  // ← ผิด!
    input.StartTime, input.EndTime)

// ✅ Logic ใหม่ (ถูกต้อง)
Where("start_time < ? AND end_time > ?", input.EndTime, input.StartTime)
```

#### 2. **Bug: Middleware Locals Key Mismatch**
**ปัญหา:** Middleware ใช้ `user_id` แต่ handler ดึงด้วย `userID`
```go
// ❌ เดิม
c.Locals("user_id", userID)      // Middleware stores
userID := c.Locals("userID")     // Handler retrieves ← Panic!

// ✅ แก้ไข
c.Locals("user_id", userID)      // Middleware stores
userID := c.Locals("user_id")    // Handler retrieves ✓
```

#### 3. **Bug: Booking Time Column Type**
**ปัญหา:** Column `start_time` และ `end_time` เป็น `timestamp` แทน `time`
```sql
-- แก้ไขด้วย SQL script
ALTER TABLE bookings ALTER COLUMN start_time TYPE time USING start_time::time;
ALTER TABLE bookings ALTER COLUMN end_time TYPE time USING end_time::time;
```

### การเพิ่ม Feature ใหม่

#### ตัวอย่าง: เพิ่ม API ดูความว่างของห้อง

**1. เพิ่ม Handler Function**
```go
// backend/internal/handlers/booking_handler.go
func (h *BookingHandler) GetByRoomAndDate(c *fiber.Ctx) error {
    roomID, _ := strconv.Atoi(c.Params("room_id"))
    date := c.Query("date")

    var bookings []models.Booking
    query := h.DB.Where("room_id = ? AND status IN (?, ?)", roomID, "pending", "approved")

    if date != "" {
        parsedDate, _ := time.Parse("2006-01-02", date)
        query = query.Where("booking_date = ?", parsedDate)
    }

    query.Order("start_time ASC").Find(&bookings)
    return utils.StandardResponse(c, fiber.StatusOK, bookings, "Success")
}
```

**2. เพิ่ม Route**
```go
// backend/internal/routes/routes.go
rooms.Get("/:id/availability", bookingHandler.GetByRoomAndDate)
```

**3. เพิ่ม API Client (Frontend)**
```typescript
// frontend/src/lib/api/client.ts
export const roomApi = {
  getAvailability: async (roomId: number, date?: string): Promise<ApiResponse<Booking[]>> => {
    const queryParams = new URLSearchParams()
    if (date) queryParams.append('date', date)
    return apiCall(`/rooms/${roomId}/availability?${queryParams.toString()}`)
  },
}
```

---

## 💡 Best Practices

### 1. **Error Handling**
```go
// ✅ ดี - ส่ง error message ที่เข้าใจง่าย
if err != nil {
    return utils.BadRequestResponse(c, "Invalid room ID")
}

// ❌ ไม่ดี - error message ไม่ชัดเจน
if err != nil {
    return c.Status(400).JSON(fiber.Map{"error": err.Error()})
}
```

### 2. **Validation**
```go
// ✅ Validate ก่อนบันทึก
if input.RoomID == 0 || input.Title == "" || input.BookingDate.IsZero() {
    return utils.BadRequestResponse(c, "Missing required fields")
}

// ✅ Validate business rules
if input.StartTime >= input.EndTime {
    return utils.BadRequestResponse(c, "Start time must be before end time")
}
```

### 3. **Security**
```go
// ✅ ตรวจสอบสิทธิ์ในการเข้าถึงข้อมูล
userID := c.Locals("user_id").(uint)
roleID := c.Locals("role_id").(uint)

if roleID != RoleAdmin && booking.UserID != int(userID) {
    return utils.ForbiddenResponse(c, "No permission to view this booking")
}
```

### 4. **Database Queries**
```go
// ✅ ใช้ parameterized queries ป้องกัน SQL injection
h.DB.Where("email = ?", email).First(&user)

// ❌ อย่าใช้ string concatenation
h.DB.Where("email = '" + email + "'").First(&user) // DANGEROUS!
```

---

## 🧪 การทดสอบ

### Test API ด้วย curl

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@su.ac.th","password":"admin123"}'

# Get buildings
curl http://localhost:8000/api/v1/buildings

# Create booking (with auth)
curl -X POST http://localhost:8000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "room_id": 1,
    "title": "ประชุมกลุ่ม",
    "booking_date": "2026-01-25",
    "start_time": "09:00",
    "end_time": "11:00"
  }'
```

---

## 📚 เอกสารเพิ่มเติม

- **[Quick Start Guide](docs/guides/QUICK_START.md)** - เริ่มต้นใช้งานโปรเจกต์
- **[Backend Guide](docs/guides/BACKEND_QUICKSTART.md)** - พัฒนา Backend
- **[Frontend Guide](docs/guides/FRONTEND_QUICKSTART.md)** - พัฒนา Frontend
- **[Architecture](docs/architecture/ARCHITECTURE_SIMPLE.md)** - โครงสร้างระบบ
- **[Seed API Guide](backend/SEED_API_GUIDE.md)** - วิธีสร้างข้อมูลทดสอบ

---

## 🎓 สรุปหลักการสำคัญ

1. **เข้าใจง่าย** - ใช้โครงสร้าง 2-layer แบบ Express.js
2. **ชื่อตัวแปรง่าย** - `user`, `booking`, `room` ไม่ซับซ้อน
3. **Direct Database Access** - Handler → Database (ไม่ผ่าน Service/Repository)
4. **Type Safety** - ใช้ TypeScript ใน Frontend, GORM ใน Backend
5. **Security First** - JWT authentication, Role-based access control
6. **Validation** - ตรวจสอบข้อมูลทั้ง Frontend และ Backend
7. **Error Handling** - Error messages ที่เข้าใจง่าย (ภาษาไทย)
8. **Clean Code** - อ่านง่าย maintain ง่าย เหมาะสำหรับเรียนรู้

---

**Version:** 1.0.0
**Last Updated:** 2026-01-24
**Maintained by:** Sumbenz
