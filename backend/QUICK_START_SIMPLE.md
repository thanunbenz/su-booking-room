# Quick Start Guide - Simplified Architecture

## 🎯 เรียนรู้ในเวลา 5 นาที

แนวทางนี้เหมาะสำหรับ:
- 🔰 มือใหม่ที่เรียน Go + Fiber
- 🚀 ต้องการพัฒนาเร็ว
- 📚 กำลังเรียนรู้ Backend Development

---

## 📋 โครงสร้างโปรเจกต์

```
backend/
├── internal/
│   ├── handlers/           # ✅ ใช้บ่อย - เขียน API logic ที่นี่
│   │   ├── auth_handler.go
│   │   ├── building_handler.go
│   │   └── room_handler.go
│   │
│   ├── models/            # ✅ ใช้บ่อย - Database models
│   │   ├── users.go
│   │   ├── building.go
│   │   └── room.go
│   │
│   ├── routes/            # ✅ ใช้บ่อย - ลงทะเบียน API endpoints
│   │   └── routes.go
│   │
│   ├── middleware/        # 🔹 ใช้บางครั้ง - Auth, Role checking
│   │   ├── auth.go
│   │   └── role.go
│   │
│   └── utils/             # 🔹 ใช้บางครั้ง - Helper functions
│       ├── jwt.go
│       ├── password.go
│       ├── response.go
│       └── validator.go
│
└── main.go               # Entry point
```

---

## 🚀 เริ่มต้น 3 ขั้นตอน

### 1. เปิด Server
```bash
cd backend
go run main.go
```

### 2. ทดสอบ Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@silpakorn.edu",
    "password": "admin123"
  }'
```

### 3. ดู Buildings
```bash
curl http://localhost:8080/api/v1/buildings
```

---

## 📝 สร้าง Feature ใหม่

### ตัวอย่าง: เพิ่ม CRUD สำหรับ "Booking"

#### Step 1: สร้าง Model
**ไฟล์**: `internal/models/booking.go`

```go
package models

import "time"

type Booking struct {
    BookingID   int       `gorm:"primaryKey;autoIncrement" json:"booking_id"`
    RoomID      int       `gorm:"not null" json:"room_id"`
    UserID      int       `gorm:"not null" json:"user_id"`
    StartTime   time.Time `gorm:"not null" json:"start_time"`
    EndTime     time.Time `gorm:"not null" json:"end_time"`
    Purpose     string    `gorm:"type:text" json:"purpose"`
    Status      string    `gorm:"type:varchar(50);default:'pending'" json:"status"`
    CreatedAt   time.Time `gorm:"default:now()" json:"created_at"`

    // Relations
    Room Room `gorm:"foreignKey:RoomID;references:RoomID" json:"room"`
    User User `gorm:"foreignKey:UserID;references:UserID" json:"user"`
}

func (Booking) TableName() string {
    return "bookings"
}
```

#### Step 2: สร้าง Handler
**ไฟล์**: `internal/handlers/booking_handler_simple.go`

```go
package handlers

import (
    "strconv"
    "github.com/gofiber/fiber/v2"
    "github.com/thanunbenz/su-booking-room/internal/models"
    "github.com/thanunbenz/su-booking-room/internal/utils"
    "gorm.io/gorm"
)

type BookingHandler struct {
    DB *gorm.DB
}

func NewBookingHandler(db *gorm.DB) *BookingHandler {
    return &BookingHandler{DB: db}
}

// GetAll - ดู bookings ทั้งหมด
func (h *BookingHandler) GetAll(c *fiber.Ctx) error {
    var bookings []models.Booking

    if err := h.DB.Preload("Room").Preload("User").Find(&bookings).Error; err != nil {
        return utils.InternalServerErrorResponse(c, err.Error())
    }

    return utils.StandardResponse(c, fiber.StatusOK, bookings, "Success")
}

// GetByID - ดู booking ตาม ID
func (h *BookingHandler) GetByID(c *fiber.Ctx) error {
    id, _ := strconv.Atoi(c.Params("id"))

    var booking models.Booking
    if err := h.DB.Preload("Room").Preload("User").First(&booking, "booking_id = ?", id).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            return utils.NotFoundResponse(c, "Booking not found")
        }
        return utils.InternalServerErrorResponse(c, err.Error())
    }

    return utils.StandardResponse(c, fiber.StatusOK, booking, "Success")
}

// Create - สร้าง booking ใหม่
func (h *BookingHandler) Create(c *fiber.Ctx) error {
    var booking models.Booking

    if err := c.BodyParser(&booking); err != nil {
        return utils.BadRequestResponse(c, "Invalid request body")
    }

    // Validate
    if booking.RoomID == 0 || booking.UserID == 0 {
        return utils.BadRequestResponse(c, "Room ID and User ID are required")
    }

    // ตรวจสอบว่า room มีอยู่ไหม
    var room models.Room
    if err := h.DB.First(&room, "room_id = ?", booking.RoomID).Error; err != nil {
        return utils.NotFoundResponse(c, "Room not found")
    }

    // บันทึก
    if err := h.DB.Create(&booking).Error; err != nil {
        return utils.InternalServerErrorResponse(c, err.Error())
    }

    // Load relations
    h.DB.Preload("Room").Preload("User").First(&booking, booking.BookingID)

    return utils.StandardResponse(c, fiber.StatusCreated, booking, "Booking created successfully")
}

// Update - อัปเดต booking
func (h *BookingHandler) Update(c *fiber.Ctx) error {
    id, _ := strconv.Atoi(c.Params("id"))

    var booking models.Booking
    if err := h.DB.First(&booking, "booking_id = ?", id).Error; err != nil {
        return utils.NotFoundResponse(c, "Booking not found")
    }

    var input models.Booking
    if err := c.BodyParser(&input); err != nil {
        return utils.BadRequestResponse(c, "Invalid request body")
    }

    // Update fields
    if input.Status != "" {
        booking.Status = input.Status
    }
    if input.Purpose != "" {
        booking.Purpose = input.Purpose
    }

    if err := h.DB.Save(&booking).Error; err != nil {
        return utils.InternalServerErrorResponse(c, err.Error())
    }

    h.DB.Preload("Room").Preload("User").First(&booking, booking.BookingID)

    return utils.StandardResponse(c, fiber.StatusOK, booking, "Booking updated successfully")
}

// Delete - ลบ booking
func (h *BookingHandler) Delete(c *fiber.Ctx) error {
    id, _ := strconv.Atoi(c.Params("id"))

    result := h.DB.Delete(&models.Booking{}, "booking_id = ?", id)
    if result.Error != nil {
        return utils.InternalServerErrorResponse(c, result.Error.Error())
    }

    if result.RowsAffected == 0 {
        return utils.NotFoundResponse(c, "Booking not found")
    }

    return utils.StandardResponse(c, fiber.StatusOK, nil, "Booking deleted successfully")
}
```

#### Step 3: ลงทะเบียน Routes
**ไฟล์**: `internal/routes/routes.go`

```go
func SetupRoutes(app *fiber.App, db *gorm.DB) {
    // ... existing handlers
    bookingHandler := handlers.NewBookingHandler(db)  // ← เพิ่มบรรทัดนี้

    api := app.Group("/api/v1")

    // ... existing routes

    // Booking routes
    bookings := api.Group("/bookings")
    bookings.Get("/", middleware.AuthMiddleware, bookingHandler.GetAll)
    bookings.Get("/:id", middleware.AuthMiddleware, bookingHandler.GetByID)
    bookings.Post("/", middleware.AuthMiddleware, bookingHandler.Create)
    bookings.Put("/:id", middleware.AuthMiddleware, bookingHandler.Update)
    bookings.Delete("/:id", middleware.AuthMiddleware, bookingHandler.Delete)
}
```

#### Step 4: Update Database
**ไฟล์**: `main.go`

```go
func main() {
    // ...
    db.AutoMigrate(
        &models.Role{},
        &models.User{},
        &models.Building{},
        &models.Room{},
        &models.Booking{},  // ← เพิ่มบรรทัดนี้
    )
    // ...
}
```

#### Step 5: ทดสอบ

```bash
# สร้าง booking
curl -X POST http://localhost:8080/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "room_id": 1,
    "user_id": 1,
    "start_time": "2024-01-20T09:00:00Z",
    "end_time": "2024-01-20T11:00:00Z",
    "purpose": "Meeting"
  }'

# ดู bookings ทั้งหมด
curl http://localhost:8080/api/v1/bookings \
  -H "Authorization: Bearer <token>"
```

---

## 🛠️ Pattern ที่ใช้บ่อย

### 1. Query Database
```go
// Get all
var items []models.Item
h.DB.Find(&items)

// Get by ID
var item models.Item
h.DB.First(&item, "id = ?", id)

// Get with condition
h.DB.Where("status = ?", "active").Find(&items)

// Create
h.DB.Create(&item)

// Update
h.DB.Save(&item)

// Delete
h.DB.Delete(&item, "id = ?", id)
```

### 2. Response Helper
```go
// Success
return utils.StandardResponse(c, 200, data, "Success")

// Error
return utils.BadRequestResponse(c, "Invalid input")
return utils.NotFoundResponse(c, "Item not found")
return utils.InternalServerErrorResponse(c, "Server error")
```

### 3. Validation
```go
// Parse body
var req Request
if err := c.BodyParser(&req); err != nil {
    return utils.BadRequestResponse(c, "Invalid request")
}

// Validate struct
if errors := utils.ValidateStruct(req); errors != nil {
    return utils.ValidationErrorResponse(c, errors)
}

// Custom validation
if req.Name == "" {
    return utils.BadRequestResponse(c, "Name is required")
}
```

### 4. Middleware
```go
// Protect route (require login)
api.Get("/protected", middleware.AuthMiddleware, handler.Method)

// Admin only
api.Post("/admin", middleware.AuthMiddleware, middleware.AdminOnly, handler.Method)

// Get user info from JWT
userID, _ := middleware.GetUserID(c)
```

---

## 📚 ตัวอย่าง API Endpoints

### Auth
```
POST   /api/v1/auth/login       - Login
POST   /api/v1/auth/register    - Register
GET    /api/v1/auth/me          - Get current user (Auth)
```

### Buildings
```
GET    /api/v1/buildings        - Get all
GET    /api/v1/buildings/:id    - Get by ID
POST   /api/v1/buildings        - Create (Admin)
PUT    /api/v1/buildings/:id    - Update (Admin)
DELETE /api/v1/buildings/:id    - Delete (Admin)
```

### Rooms
```
GET    /api/v1/rooms                   - Get all
GET    /api/v1/rooms/:id               - Get by ID
GET    /api/v1/buildings/:id/rooms     - Get by building
POST   /api/v1/rooms                   - Create (Admin)
PUT    /api/v1/rooms/:id               - Update (Admin)
DELETE /api/v1/rooms/:id               - Delete (Admin)
```

---

## 🐛 Debug Tips

### 1. ดู SQL Query
```go
// เปิด log mode
db = db.Debug()

// หรือ
h.DB.Debug().Find(&items)
```

### 2. ดู Request Body
```go
bodyBytes := c.Body()
fmt.Println("Request body:", string(bodyBytes))
```

### 3. Print เพื่อ Debug
```go
fmt.Printf("User ID: %d\n", userID)
fmt.Printf("Data: %+v\n", data)
```

---

## 📖 อ่านเพิ่มเติม

- [ARCHITECTURE_SIMPLE.md](./ARCHITECTURE_SIMPLE.md) - อธิบายโครงสร้างแบบละเอียด
- [REFACTOR_COMPARISON.md](./REFACTOR_COMPARISON.md) - เปรียบเทียบ Before/After
- [Fiber Documentation](https://docs.gofiber.io/) - เอกสาร Fiber framework
- [GORM Documentation](https://gorm.io/docs/) - เอกสาร GORM (ORM)

---

## ⚡ สรุป

1. **สร้าง Model** → กำหนดโครงสร้าง database
2. **สร้าง Handler** → เขียน API logic (CRUD)
3. **ลงทะเบียน Routes** → เชื่อม URL กับ handler
4. **Update Migration** → เพิ่ม model ใน AutoMigrate
5. **ทดสอบ** → ใช้ curl หรือ Postman

แค่นี้ก็พัฒนา API ได้แล้ว! 🎉
