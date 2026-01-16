# Architecture แบบง่าย (Express.js Style)

## สรุปการ Refactor

ระบบได้ถูก refactor จาก **3-layer architecture** เป็น **2-layer MVC style** เหมือน Express.js เพื่อให้เรียนรู้และเข้าใจง่ายขึ้น

## โครงสร้างเดิม (3 Layers)

```
Handler → Service → Repository → Database
```

- **Handler**: รับ request และส่ง response
- **Service**: Business logic
- **Repository**: Query database
- **Database**: PostgreSQL

### ข้อเสีย
- มีหลายไฟล์และหลาย layer
- ซับซ้อนเกินไปสำหรับ CRUD ง่ายๆ
- ยากต่อการเรียนรู้สำหรับมือใหม่

## โครงสร้างใหม่ (2 Layers)

```
Handler → Database
```

- **Handler**: รับ request + query database + ส่ง response
- **Database**: PostgreSQL

### ข้อดี
- เข้าใจง่าย เหมือน Express.js controller
- ไฟล์น้อยลง code สั้นลง
- เหมาะสำหรับเรียนรู้และโปรเจกต์ขนาดเล็ก

## ไฟล์ที่สร้างใหม่

### 1. Auth Handler
**ไฟล์**: `internal/handlers/auth_handler.go`

```go
type AuthHandler struct {
    DB *gorm.DB  // เชื่อมตรง database
}

// Login - ตรวจสอบ email/password และสร้าง JWT tokens
func (h *AuthHandler) Login(c *fiber.Ctx) error {
    // 1. Parse request
    // 2. Query user from database
    // 3. Check password
    // 4. Generate tokens
    // 5. Return response
}

// Register - สร้าง user ใหม่
func (h *AuthHandler) Register(c *fiber.Ctx) error {
    // 1. Parse request
    // 2. Validate
    // 3. Check duplicate email
    // 4. Hash password
    // 5. Create user
    // 6. Return response
}

// GetMe - ดึงข้อมูล user ปัจจุบัน
func (h *AuthHandler) GetMe(c *fiber.Ctx) error {
    // 1. Get user_id from JWT middleware
    // 2. Query user from database
    // 3. Return response
}
```

### 2. Building Handler
**ไฟล์**: `internal/handlers/building_handler.go`

```go
type BuildingHandler struct {
    DB *gorm.DB
}

// CRUD Operations
- GetAll()    // ดู buildings ทั้งหมด
- GetByID()   // ดู building ตาม ID
- Create()    // สร้าง building ใหม่
- Update()    // แก้ไข building
- Delete()    // ลบ building
```

### 3. Room Handler
**ไฟล์**: `internal/handlers/room_handler.go`

```go
type RoomHandler struct {
    DB *gorm.DB
}

// CRUD Operations
- GetAll()          // ดู rooms ทั้งหมด
- GetByID()         // ดู room ตาม ID
- GetByBuildingID() // ดู rooms ในตึก
- Create()          // สร้าง room ใหม่
- Update()          // แก้ไข room
- Delete()          // ลบ room
```

## Routes Setup

**ไฟล์**: `internal/routes/routes.go`

```go
func SetupRoutes(app *fiber.App, db *gorm.DB) {
    // สร้าง handlers แบบง่าย - เชื่อมตรงกับ database
    authHandler := handlers.NewAuthHandler(db)
    buildingHandler := handlers.NewBuildingHandler(db)
    roomHandler := handlers.NewRoomHandler(db)

    // ลงทะเบียน routes...
}
```

## การใช้งาน

### 1. Login
```bash
POST /api/v1/auth/login
{
  "email": "admin@silpakorn.edu",
  "password": "admin123"
}
```

### 2. Register
```bash
POST /api/v1/auth/register
{
  "email": "user@silpakorn.edu",
  "password": "password123",
  "fullname": "John Doe",
  "username": "johndoe"
}
```

### 3. Get Current User
```bash
GET /api/v1/auth/me
Authorization: Bearer <token>
```

### 4. Buildings CRUD
```bash
GET    /api/v1/buildings      # ดูทั้งหมด
GET    /api/v1/buildings/:id  # ดูตาม ID
POST   /api/v1/buildings      # สร้างใหม่ (Admin only)
PUT    /api/v1/buildings/:id  # แก้ไข (Admin only)
DELETE /api/v1/buildings/:id  # ลบ (Admin only)
```

### 5. Rooms CRUD
```bash
GET    /api/v1/rooms              # ดูทั้งหมด
GET    /api/v1/rooms/:id          # ดูตาม ID
GET    /api/v1/buildings/:id/rooms # ดู rooms ในตึก
POST   /api/v1/rooms              # สร้างใหม่ (Admin only)
PUT    /api/v1/rooms/:id          # แก้ไข (Admin only)
DELETE /api/v1/rooms/:id          # ลบ (Admin only)
```

## ข้อแตกต่างกับ Express.js

### Express.js (Node.js)
```javascript
// controller
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  // ... logic
  res.json({ user, tokens });
});
```

### Go Fiber (แบบใหม่)
```go
// handler
func (h *AuthHandler) Login(c *fiber.Ctx) error {
    var req LoginRequest
    c.BodyParser(&req)

    var user models.User
    h.DB.Where("email = ?", req.Email).First(&user)
    // ... logic
    return utils.StandardResponse(c, 200, response, "Success")
}
```

## Pattern ที่ใช้

### 1. Direct Database Access
```go
// ไม่ต้องผ่าน Service/Repository
h.DB.Find(&buildings)
h.DB.Create(&building)
h.DB.Update(&building)
h.DB.Delete(&building)
```

### 2. Response Helper Functions
```go
utils.StandardResponse(c, statusCode, data, message)
utils.BadRequestResponse(c, message)
utils.NotFoundResponse(c, message)
utils.InternalServerErrorResponse(c, message)
```

### 3. Validation
```go
if errors := utils.ValidateStruct(req); errors != nil {
    return utils.ValidationErrorResponse(c, errors)
}
```

## เมื่อไหร่ควรใช้ 3-layer Architecture?

### ใช้ 2-layer (แบบง่าย) เมื่อ:
- โปรเจกต์ขนาดเล็ก
- CRUD ง่ายๆ
- กำลังเรียนรู้
- ต้องการ development เร็ว

### ใช้ 3-layer (แบบเต็ม) เมื่อ:
- โปรเจกต์ขนาดใหญ่
- Business logic ซับซ้อน
- ต้อง reuse logic หลายที่
- มีหลาย data source
- ต้อง test แยก layer

## Next Steps

1. ✅ Refactor handlers เสร็จแล้ว
2. ลบไฟล์ที่ไม่ใช้: services/, repositories/ (optional)
3. Test endpoints ทั้งหมด
4. เขียน documentation เพิ่มเติม
5. Deploy

## สรุป

การ refactor นี้ทำให้:
- **Code สั้นลง** จาก 9 ไฟล์ เหลือ 3 ไฟล์
- **เข้าใจง่ายขึ้น** แบบ MVC ของ Express.js
- **Development เร็วขึ้น** ไม่ต้องสร้างหลาย layer
- **เหมาะสำหรับเรียนรู้** มือใหม่เข้าใจได้ง่าย

ระบบยังคงใช้งานได้เหมือนเดิม แต่ code structure ง่ายและชัดเจนกว่ามาก! 🎉
