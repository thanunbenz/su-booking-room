# SU Booking Room - Backend

Backend API สำหรับระบบจองห้องของมหาวิทยาลัย พัฒนาด้วย Go Fiber Framework

## 🏗️ โครงสร้างแบบง่าย (Simple MVC Architecture)

โปรเจกต์นี้ใช้โครงสร้างแบบง่าย **2-layer architecture** เหมือน Express.js เพื่อความเรียบง่ายและเรียนรู้ได้ง่าย

```
Handler → Database (ไม่ต้องผ่าน Service/Repository)
```

## 📁 โครงสร้างโปรเจ็กต์

```
backend/
├── internal/                    # Private application code
│   ├── config/                  # การตั้งค่า database
│   │   └── database.go
│   │
│   ├── handlers/                # HTTP handlers (MVC Controllers)
│   │   ├── auth_handler.go       # Login, Register, GetMe
│   │   ├── building_handler.go   # Buildings CRUD
│   │   ├── room_handler.go       # Rooms CRUD
│   │   └── health_handler.go            # Health check
│   │
│   ├── models/                  # Database models (GORM)
│   │   ├── role.go              # บทบาทผู้ใช้
│   │   ├── users.go             # ข้อมูลผู้ใช้
│   │   ├── building.go          # อาคาร
│   │   ├── room.go              # ห้อง
│   │   ├── booking.go           # การจอง
│   │   ├── fixed_schedule.go    # ตารางการจอง
│   │   └── notification.go      # การแจ้งเตือน
│   │
│   ├── routes/                  # API route definitions
│   │   └── routes.go
│   │
│   ├── middleware/              # Middleware functions
│   │   ├── auth.go              # JWT authentication
│   │   ├── role.go              # Role-based authorization
│   │   ├── error.go             # Error handling
│   │   └── logger.go            # Request logging
│   │
│   ├── utils/                   # Helper functions
│   │   ├── jwt.go               # JWT token generation/validation
│   │   ├── password.go          # Password hashing (bcrypt)
│   │   ├── response.go          # Standard response helpers
│   │   └── validator.go         # Request validation
│   │
│   └── seed/                    # Database seeder
│       └── seeder.go            # สร้างข้อมูลเริ่มต้น (roles, admin)
│
├── go.mod / go.sum              # Go dependencies
├── main.go                      # Entry point
├── Dockerfile                   # Docker build configuration
├── .dockerignore
│
└── docs/                        # เอกสารเพิ่มเติม
    ├── ARCHITECTURE_SIMPLE.md   # อธิบายโครงสร้างแบบง่าย
    ├── REFACTOR_COMPARISON.md   # เปรียบเทียบ Before/After
    ├── QUICK_START_SIMPLE.md    # คู่มือเริ่มต้น + สร้าง feature ใหม่
    ├── API_TESTING.md           # วิธี test API
    └── MIGRATION_FIX.md         # แก้ปัญหา migration
```

## ⚡ ทำไมถึงใช้โครงสร้างแบบง่าย?

### ข้อดี

- ✅ **เข้าใจง่าย** - เหมือน Express.js controller
- ✅ **Code สั้นลง** - ลดจาก 12 ไฟล์ เหลือ 3 ไฟล์ (-75%)
- ✅ **พัฒนาเร็วขึ้น** - ไม่ต้องสร้างหลาย layer
- ✅ **เหมาะสำหรับเรียนรู้** - มือใหม่เข้าใจได้ง่าย
- ✅ **เหมาะกับ CRUD** - โปรเจกต์ขนาดเล็ก-กลาง

### เมื่อไหร่ควรใช้ 3-layer?

- Business logic ซับซ้อนมาก
- ต้อง reuse logic หลายที่
- มีหลาย data source
- ทีมใหญ่ที่ต้อง strict architecture

## 🚀 การติดตั้งและใช้งาน

### Prerequisites

- Go 1.25 หรือสูงกว่า
- PostgreSQL 16
- Docker & Docker Compose (แนะนำ)

### ด้วย Docker (แนะนำ)

```bash
# 1. Start all services
cd ..
make up

# 2. ตรวจสอบ logs
make logs-backend
```

### การพัฒนาแบบ Local

```bash
# 1. Install dependencies
go mod download

# 2. Setup environment
cp .env.example .env
# แก้ไขค่าใน .env

# 3. Run server
go run main.go

# หรือใช้ make
cd ..
make dev-backend
```

## 📝 API Endpoints

### Auth (Public)

```
POST   /api/v1/auth/login      - Login
POST   /api/v1/auth/register   - Register
GET    /api/v1/auth/me         - Get current user (Auth required)
```

### Buildings (Public Read, Admin Write)

```
GET    /api/v1/buildings       - Get all buildings
GET    /api/v1/buildings/:id   - Get building by ID
POST   /api/v1/buildings       - Create building (Admin only)
PUT    /api/v1/buildings/:id   - Update building (Admin only)
DELETE /api/v1/buildings/:id   - Delete building (Admin only)
```

### Rooms (Public Read, Admin Write)

```
GET    /api/v1/rooms                  - Get all rooms
GET    /api/v1/rooms/:id              - Get room by ID
GET    /api/v1/buildings/:id/rooms    - Get rooms in building
POST   /api/v1/rooms                  - Create room (Admin only)
PUT    /api/v1/rooms/:id              - Update room (Admin only)
DELETE /api/v1/rooms/:id              - Delete room (Admin only)
```

### Health Check

```
GET    /api/v1/health          - Check API status
```

## 🎯 ตัวอย่างการใช้งาน

### 1. Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@silpakorn.edu",
    "password": "admin123"
  }'
```

### 2. Get Buildings

```bash
curl http://localhost:8080/api/v1/buildings
```

### 3. Create Building (Admin)

```bash
curl -X POST http://localhost:8080/api/v1/buildings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "name": "อาคาร 1",
    "description": "อาคารเรียนชั้น 1"
  }'
```

## 🛠️ Development

### การสร้าง Feature ใหม่

อ่านคู่มือโดยละเอียดที่ [QUICK_START_SIMPLE.md](QUICK_START_SIMPLE.md)

**สรุป 4 ขั้นตอน:**

1. สร้าง Model → `internal/models/`
2. สร้าง Handler → `internal/handlers/`
3. ลงทะเบียน Routes → `internal/routes/routes.go`
4. Update Migration → `main.go`

### Pattern ที่ใช้บ่อย

#### Query Database

```go
// Get all
h.DB.Find(&items)

// Get by ID
h.DB.First(&item, "id = ?", id)

// Create
h.DB.Create(&item)

// Update
h.DB.Save(&item)

// Delete
h.DB.Delete(&item)
```

#### Response

```go
// Success
return utils.StandardResponse(c, 200, data, "Success")

// Error
return utils.BadRequestResponse(c, "Invalid input")
return utils.NotFoundResponse(c, "Not found")
return utils.InternalServerErrorResponse(c, "Server error")
```

#### Validation

```go
if errors := utils.ValidateStruct(req); errors != nil {
    return utils.ValidationErrorResponse(c, errors)
}
```

### Build & Test

```bash
# Build binary
go build -o bin/server main.go

# Run
./bin/server

# Test (เมื่อมี tests)
go test -v ./...

# Build Docker image
docker build -t su-booking-backend .
```

## 🗄️ Database

### Default Users

```
Admin:
  Email: admin@silpakorn.edu
  Password: admin123
  Role: Admin (role_id: 1)
```

### Roles

```
1 = Admin     - จัดการระบบทั้งหมด
2 = Teacher   - จองห้อง ดูตารางตัวเอง
3 = Visitor   - ดูตารางอย่างเดียว (read-only)
```

### Reset Database

```bash
# WARNING: ลบข้อมูลทั้งหมด!
cd ..
make db-reset
```

### Database Shell

```bash
cd ..
make db-shell
```

## 🧪 API Testing

### ด้วย Postman

```bash
# Import ไฟล์เหล่านี้เข้า Postman
1. ../docs/api/SU_Booking_Room_Postman_Collection.json  # Collection
2. ../docs/api/SU_Booking_Room_Postman_Environment.json  # Environment
```

### ด้วย Bash Script (Automated)

```bash
# ให้สิทธิ์ execute
chmod +x ../docs/api/test_booking_api.sh

# รัน test
../docs/api/test_booking_api.sh
```

### ด้วย curl (Manual)

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@silpakorn.edu", "password": "admin123"}'

# Create Booking
curl -X POST http://localhost:8000/api/v1/bookings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": 1,
    "title": "ประชุม",
    "booking_date": "2026-01-25",
    "start_time": "14:00",
    "end_time": "16:00"
  }'
```

📖 **รายละเอียด:** [Booking API Test Guide](../docs/api/BOOKING_API_TEST.md)

## 📖 เอกสารเพิ่มเติม

- **[BOOKING_API_TEST.md](../docs/api/BOOKING_API_TEST.md)** - คู่มือทดสอบ Booking API
- **[ARCHITECTURE_SIMPLE.md](ARCHITECTURE_SIMPLE.md)** - อธิบายโครงสร้างแบบละเอียด
- **[REFACTOR_COMPARISON.md](REFACTOR_COMPARISON.md)** - เปรียบเทียบ Before/After
- **[QUICK_START_SIMPLE.md](QUICK_START_SIMPLE.md)** - คู่มือเริ่มต้น 5 นาที
- **[API_TESTING.md](API_TESTING.md)** - วิธีทดสอบ API
- **[Root README](../README.md)** - ข้อมูลโปรเจกต์ทั้งหมด

## 🔧 Tech Stack

- **Language**: Go 1.25.4
- **Web Framework**: Fiber v2
- **ORM**: GORM v1.31
- **Database**: PostgreSQL 16
- **Auth**: JWT tokens
- **Password**: Bcrypt (cost 14)
- **Validation**: go-playground/validator

## 📊 Performance

- **Startup time**: ~2 seconds
- **Memory usage**: ~20 MB
- **Response time**: <10ms (local)
- **Docker image**: ~25 MB (Alpine-based)

## 🐛 Troubleshooting

### Port already in use

```bash
# ตรวจสอบ process ที่ใช้ port 8080
lsof -i :8080

# ฆ่า process
kill -9 <PID>
```

### Database connection error

```bash
# ตรวจสอบว่า PostgreSQL รันอยู่ไหม
make status

# Restart database
make restart
```

### Migration failed

อ่าน [MIGRATION_FIX.md](MIGRATION_FIX.md)

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Authors

- **Sumbenz** - _Initial work & Architecture_

---

**Last Updated:** 2026-01-14
**Version:** 2.0.0 (Simplified Architecture)
