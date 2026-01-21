# 🔐 Role-Based Authorization Guide

## Role IDs ในระบบ

```go
const (
    RoleAdmin   = 1  // แอดมิน
    RoleTeacher = 2  // อาจารย์
    RoleVisitor = 3  // ผู้เยี่ยมชม
)
```

---

## Middleware ที่มีให้ใช้

### 1. AdminOnly - เฉพาะ Admin
```go
middleware.AdminOnly
```

### 2. TeacherOrAdmin - Admin หรือ Teacher
```go
middleware.TeacherOrAdmin
```

### 3. RequireRole - ระบุ Role แบบ Flexible
```go
middleware.RequireRole(middleware.RoleAdmin, middleware.RoleTeacher)
```

---

## ตัวอย่างการใช้งานใน Routes

### 1. Public Routes (ไม่ต้อง Login)
```go
// ทุกคนเข้าถึงได้
buildings.Get("/", buildingHandler.GetAll)
rooms.Get("/", roomHandler.GetAll)
```

### 2. Protected Routes (ต้อง Login)
```go
// ต้อง login แต่ role ไหนก็ได้
auth.Get("/me", middleware.AuthMiddleware, authHandler.GetMe)
```

### 3. Admin Only Routes
```go
// เฉพาะ Admin เท่านั้น
buildings.Post("/", middleware.AuthMiddleware, middleware.AdminOnly, buildingHandler.Create)
buildings.Put("/:id", middleware.AuthMiddleware, middleware.AdminOnly, buildingHandler.Update)
buildings.Delete("/:id", middleware.AuthMiddleware, middleware.AdminOnly, buildingHandler.Delete)
```

### 4. Teacher or Admin Routes
```go
// Admin หรือ Teacher ใช้ได้
bookings.Post("/", middleware.AuthMiddleware, middleware.TeacherOrAdmin, bookingHandler.Create)
bookings.Get("/my", middleware.AuthMiddleware, middleware.TeacherOrAdmin, bookingHandler.GetMyBookings)
```

### 5. Custom Role Combinations
```go
// วิธีที่ 1: ใช้ RequireRole
bookings.Post("/",
    middleware.AuthMiddleware,
    middleware.RequireRole(middleware.RoleAdmin, middleware.RoleTeacher),
    bookingHandler.Create,
)

// วิธีที่ 2: ใช้ TeacherOrAdmin (แนะนำ)
bookings.Post("/",
    middleware.AuthMiddleware,
    middleware.TeacherOrAdmin,
    bookingHandler.Create,
)
```

---

## ตัวอย่างการตั้งค่า Routes ตามแต่ละ Feature

### 📋 Auth Routes
```go
auth := api.Group("/auth")
auth.Post("/login", authHandler.Login)                              // Public
auth.Post("/register", authHandler.Register)                        // Public
auth.Get("/me", middleware.AuthMiddleware, authHandler.GetMe)       // All authenticated users
```

### 🏢 Building Routes
```go
buildings := api.Group("/buildings")
buildings.Get("/", buildingHandler.GetAll)                          // Public
buildings.Get("/:id", buildingHandler.GetByID)                      // Public
buildings.Post("/",
    middleware.AuthMiddleware,
    middleware.AdminOnly,                                           // Admin only
    buildingHandler.Create,
)
buildings.Put("/:id",
    middleware.AuthMiddleware,
    middleware.AdminOnly,                                           // Admin only
    buildingHandler.Update,
)
buildings.Delete("/:id",
    middleware.AuthMiddleware,
    middleware.AdminOnly,                                           // Admin only
    buildingHandler.Delete,
)
```

### 🚪 Room Routes
```go
rooms := api.Group("/rooms")
rooms.Get("/", roomHandler.GetAll)                                  // Public
rooms.Get("/:id", roomHandler.GetByID)                              // Public
rooms.Post("/",
    middleware.AuthMiddleware,
    middleware.AdminOnly,                                           // Admin only
    roomHandler.Create,
)
rooms.Put("/:id",
    middleware.AuthMiddleware,
    middleware.AdminOnly,                                           // Admin only
    roomHandler.Update,
)
rooms.Delete("/:id",
    middleware.AuthMiddleware,
    middleware.AdminOnly,                                           // Admin only
    roomHandler.Delete,
)
```

### 📅 Fixed Schedule Routes
```go
schedules := api.Group("/schedules")
schedules.Get("/", scheduleHandler.GetAll)                          // Public
schedules.Get("/:id", scheduleHandler.GetByID)                      // Public
schedules.Post("/",
    middleware.AuthMiddleware,
    middleware.AdminOnly,                                           // Admin only
    scheduleHandler.Create,
)
schedules.Put("/:id",
    middleware.AuthMiddleware,
    middleware.AdminOnly,                                           // Admin only
    scheduleHandler.Update,
)
schedules.Delete("/:id",
    middleware.AuthMiddleware,
    middleware.AdminOnly,                                           // Admin only
    scheduleHandler.Delete,
)
```

### 📖 Booking Routes
```go
bookings := api.Group("/bookings")

// Query bookings
bookings.Get("/",
    middleware.AuthMiddleware,
    middleware.AdminOnly,                                           // Admin only
    bookingHandler.GetAll,
)
bookings.Get("/my",
    middleware.AuthMiddleware,
    middleware.TeacherOrAdmin,                                      // Teacher or Admin
    bookingHandler.GetMyBookings,
)
bookings.Get("/:id",
    middleware.AuthMiddleware,
    bookingHandler.GetByID,                                         // Owner or Admin (check in handler)
)

// Create bookings
bookings.Post("/",
    middleware.AuthMiddleware,
    middleware.TeacherOrAdmin,                                      // Teacher or Admin
    bookingHandler.Create,
)
bookings.Post("/multiple",
    middleware.AuthMiddleware,
    middleware.TeacherOrAdmin,                                      // Teacher or Admin
    bookingHandler.CreateMultiple,
)

// Update/Delete bookings
bookings.Put("/:id",
    middleware.AuthMiddleware,
    middleware.TeacherOrAdmin,                                      // Owner or Admin (check in handler)
    bookingHandler.Update,
)
bookings.Delete("/:id",
    middleware.AuthMiddleware,
    middleware.TeacherOrAdmin,                                      // Owner or Admin (check in handler)
    bookingHandler.Delete,
)

// Approval (Admin only)
bookings.Put("/:id/approve",
    middleware.AuthMiddleware,
    middleware.AdminOnly,                                           // Admin only
    bookingHandler.Approve,
)
bookings.Put("/:id/reject",
    middleware.AuthMiddleware,
    middleware.AdminOnly,                                           // Admin only
    bookingHandler.Reject,
)
bookings.Put("/:id/cancel",
    middleware.AuthMiddleware,
    middleware.AdminOnly,                                           // Admin only
    bookingHandler.Cancel,
)
```

### 👥 User Management Routes
```go
users := api.Group("/users")
users.Get("/",
    middleware.AuthMiddleware,
    middleware.AdminOnly,                                           // Admin only
    userHandler.GetAll,
)
users.Get("/:id",
    middleware.AuthMiddleware,
    middleware.AdminOnly,                                           // Admin only
    userHandler.GetByID,
)
users.Post("/",
    middleware.AuthMiddleware,
    middleware.AdminOnly,                                           // Admin only
    userHandler.Create,
)
users.Put("/:id",
    middleware.AuthMiddleware,
    middleware.AdminOnly,                                           // Admin only
    userHandler.Update,
)
users.Delete("/:id",
    middleware.AuthMiddleware,
    middleware.AdminOnly,                                           // Admin only
    userHandler.Delete,
)
```

### 🔔 Notification Routes
```go
notifications := api.Group("/notifications")
notifications.Get("/",
    middleware.AuthMiddleware,                                      // All authenticated users
    notificationHandler.GetAll,
)
notifications.Get("/:id",
    middleware.AuthMiddleware,                                      // All authenticated users
    notificationHandler.GetByID,
)
notifications.Put("/:id/read",
    middleware.AuthMiddleware,                                      // All authenticated users
    notificationHandler.MarkAsRead,
)
notifications.Put("/read-all",
    middleware.AuthMiddleware,                                      // All authenticated users
    notificationHandler.MarkAllAsRead,
)
notifications.Delete("/:id",
    middleware.AuthMiddleware,                                      // All authenticated users
    notificationHandler.Delete,
)
```

---

## สรุปสิทธิ์การใช้งานแต่ละ Feature

| Feature | Public | Visitor | Teacher | Admin |
|---------|--------|---------|---------|-------|
| **View Buildings** | ✅ | ✅ | ✅ | ✅ |
| **View Rooms** | ✅ | ✅ | ✅ | ✅ |
| **View Schedules** | ✅ | ✅ | ✅ | ✅ |
| **Create Booking** | ❌ | ❌ | ✅ | ✅ |
| **View My Bookings** | ❌ | ❌ | ✅ | ✅ |
| **Edit My Booking** | ❌ | ❌ | ✅ | ✅ |
| **Cancel My Booking** | ❌ | ❌ | ✅ | ✅ |
| **Approve/Reject Booking** | ❌ | ❌ | ❌ | ✅ |
| **Manage Buildings** | ❌ | ❌ | ❌ | ✅ |
| **Manage Rooms** | ❌ | ❌ | ❌ | ✅ |
| **Manage Schedules** | ❌ | ❌ | ❌ | ✅ |
| **Manage Users** | ❌ | ❌ | ❌ | ✅ |
| **View Notifications** | ❌ | ✅ | ✅ | ✅ |

---

## ตัวอย่างการตรวจสอบ Ownership ใน Handler

สำหรับ endpoints ที่ Teacher สามารถแก้ไขได้แค่ของตัวเอง ต้องเพิ่มการตรวจสอบใน Handler:

```go
// ตัวอย่าง: แก้ไข booking
func (h *BookingHandler) Update(c *fiber.Ctx) error {
    userID, _ := middleware.GetUserID(c)
    roleID, _ := middleware.GetRoleID(c)
    bookingID, _ := strconv.Atoi(c.Params("id"))

    // หา booking
    var booking models.Booking
    if err := h.DB.First(&booking, bookingID).Error; err != nil {
        return utils.NotFoundResponse(c, "Booking not found")
    }

    // ตรวจสอบ: ต้องเป็น owner หรือ admin เท่านั้น
    if booking.UserID != int(userID) && roleID != middleware.RoleAdmin {
        return utils.ForbiddenResponse(c, "You can only edit your own bookings")
    }

    // ... update logic ...
}
```

---

## วิธีทดสอบ Authorization

### 1. Login เพื่อรับ Token
```bash
POST /api/v1/auth/login
{
  "email": "admin@silpakorn.edu",
  "password": "admin123"
}
```

### 2. ใช้ Token ใน Header
```bash
Authorization: Bearer <access_token>
```

### 3. Test Different Roles
- Admin: ควรเข้าถึงทุกอย่างได้
- Teacher: เข้าถึงได้แค่ Teacher routes
- Visitor: เข้าถึงได้แค่ Public routes

---

## Error Responses

### 401 Unauthorized - ไม่มี Token หรือ Token ไม่ถูกต้อง
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized: User not authenticated"
  }
}
```

### 403 Forbidden - มี Token แต่ Role ไม่ถูกต้อง
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Forbidden: Admin access required"
  }
}
```
