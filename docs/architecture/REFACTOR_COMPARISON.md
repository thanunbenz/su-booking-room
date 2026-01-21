# Refactor Comparison - Before & After

## สรุปการเปลี่ยนแปลง

เปลี่ยนจาก **3-layer Architecture** → **2-layer MVC (Express.js style)**

## 📊 สถิติ

| | Before | After | ผลต่าง |
|---|---|---|---|
| **จำนวนไฟล์** | 12 ไฟล์ | 3 ไฟล์ | **-75%** |
| **จำนวน layers** | 3 layers | 2 layers | **-33%** |
| **บรรทัด code** | ~1,200 บรรทัด | ~400 บรรทัด | **-67%** |

## 📁 ไฟล์ที่เปลี่ยนแปลง

### ❌ ไฟล์เก่าที่ไม่ใช้แล้ว (Optional Delete)
```
internal/repositories/
  ├── user_repository.go
  ├── building_repository.go
  └── room_repository.go

internal/services/
  ├── auth_service.go
  ├── building_service.go
  └── room_service.go

internal/handlers/
  ├── auth_handler.go       (เก่า)
  ├── building_handler.go   (เก่า)
  └── room_handler.go       (เก่า)
```

### ✅ ไฟล์ใหม่ที่ใช้
```
internal/handlers/
  ├── auth_handler.go
  ├── building_handler.go
  └── room_handler.go

internal/routes/
  └── routes.go (อัปเดตแล้ว)
```

## 🔄 ตัวอย่างการเปลี่ยนแปลง

### 1. Building - Get All

#### Before (3 layers)
```go
// repository
func (r *BuildingRepository) GetAll() ([]models.Building, error) {
    var buildings []models.Building
    if err := r.DB.Find(&buildings).Error; err != nil {
        return nil, err
    }
    return buildings, nil
}

// service
func (s *BuildingService) GetAll() ([]BuildingResponse, error) {
    buildings, err := s.buildingRepo.GetAll()
    if err != nil {
        return nil, err
    }
    // Convert to response...
    return responses, nil
}

// handler
func (h *BuildingHandler) GetAll(c *fiber.Ctx) error {
    buildings, err := h.buildingService.GetAll()
    if err != nil {
        return utils.InternalServerErrorResponse(c, err.Error())
    }
    return utils.StandardResponse(c, fiber.StatusOK, buildings, "Success")
}
```

#### After (2 layers)
```go
// handler only
func (h *BuildingHandler) GetAll(c *fiber.Ctx) error {
    var buildings []models.Building
    if err := h.DB.Find(&buildings).Error; err != nil {
        return utils.InternalServerErrorResponse(c, err.Error())
    }
    return utils.StandardResponse(c, fiber.StatusOK, buildings, "Success")
}
```

**ผลลัพธ์**: จาก **3 functions ใน 3 ไฟล์** → เหลือ **1 function ใน 1 ไฟล์**

---

### 2. Auth - Login

#### Before (3 layers)
```go
// repository
func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
    var user models.User
    if err := r.DB.Preload("Role").Where("email = ?", email).First(&user).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            return nil, errors.New("user not found")
        }
        return nil, err
    }
    return &user, nil
}

// service
func (s *AuthService) Login(req LoginRequest) (*LoginResponse, error) {
    user, err := s.userRepo.FindByEmail(req.Email)
    if err != nil {
        return nil, err
    }

    if !utils.ComparePassword(user.Password, req.Password) {
        return nil, errors.New("invalid password")
    }

    accessToken, _ := utils.GenerateToken(uint(user.UserID), uint(user.RoleID), user.Fullname)
    refreshToken, _ := utils.GenerateRefreshToken(uint(user.UserID), uint(user.RoleID), user.Fullname)

    response := &LoginResponse{
        User:   convertUserToResponse(user),
        Tokens: TokensResponse{AccessToken: accessToken, RefreshToken: refreshToken},
    }
    return response, nil
}

// handler
func (h *AuthHandler) Login(c *fiber.Ctx) error {
    var req services.LoginRequest
    if err := c.BodyParser(&req); err != nil {
        return utils.BadRequestResponse(c, "Invalid request body")
    }

    if errors := utils.ValidateStruct(req); errors != nil {
        return utils.ValidationErrorResponse(c, errors)
    }

    response, err := h.authService.Login(req)
    if err != nil {
        // Handle errors...
        return utils.InternalServerErrorResponse(c, err.Error())
    }

    return utils.StandardResponse(c, fiber.StatusOK, response, "Login successful")
}
```

#### After (2 layers)
```go
// handler only
func (h *AuthHandler) Login(c *fiber.Ctx) error {
    var req LoginRequest
    if err := c.BodyParser(&req); err != nil {
        return utils.BadRequestResponse(c, "Invalid request body")
    }

    if errors := utils.ValidateStruct(req); errors != nil {
        return utils.ValidationErrorResponse(c, errors)
    }

    // Query user
    var user models.User
    if err := h.DB.Preload("Role").Where("email = ?", req.Email).First(&user).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            return utils.ErrorResponseJSON(c, fiber.StatusNotFound, "USER_NOT_FOUND", "User not found", nil)
        }
        return utils.InternalServerErrorResponse(c, err.Error())
    }

    // Check password
    if !utils.ComparePassword(user.Password, req.Password) {
        return utils.ErrorResponseJSON(c, fiber.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid credentials", nil)
    }

    // Generate tokens
    accessToken, _ := utils.GenerateToken(uint(user.UserID), uint(user.RoleID), user.Fullname)
    refreshToken, _ := utils.GenerateRefreshToken(uint(user.UserID), uint(user.RoleID), user.Fullname)

    response := map[string]interface{}{
        "user": map[string]interface{}{
            "id":       user.UserID,
            "email":    user.Email,
            "fullname": user.Fullname,
            "role":     map[string]interface{}{"id": user.Role.RoleID, "name": user.Role.RoleName},
        },
        "tokens": map[string]interface{}{
            "access_token":  accessToken,
            "refresh_token": refreshToken,
        },
    }

    return utils.StandardResponse(c, fiber.StatusOK, response, "Login successful")
}
```

**ผลลัพธ์**: จาก **3 functions ใน 3 ไฟล์** → เหลือ **1 function ใน 1 ไฟล์**

---

### 3. Routes Setup

#### Before
```go
func SetupRoutes(app *fiber.App, db *gorm.DB) {
    // Setup repositories
    userRepo := repositories.NewUserRepository(db)
    buildingRepo := repositories.NewBuildingRepository(db)
    roomRepo := repositories.NewRoomRepository(db)

    // Setup services
    authService := services.NewAuthService(userRepo)
    buildingService := services.NewBuildingService(buildingRepo)
    roomService := services.NewRoomService(roomRepo, buildingRepo)

    // Setup handlers
    authHandler := handlers.NewAuthHandler(authService)
    buildingHandler := handlers.NewBuildingHandler(buildingService)
    roomHandler := handlers.NewRoomHandler(roomService)

    // Register routes...
}
```

#### After
```go
func SetupRoutes(app *fiber.App, db *gorm.DB) {
    // Setup handlers (direct DB connection)
    authHandler := handlers.NewAuthHandler(db)
    buildingHandler := handlers.NewBuildingHandler(db)
    roomHandler := handlers.NewRoomHandler(db)

    // Register routes...
}
```

**ผลลัพธ์**: จาก **15 บรรทัด** → เหลือ **5 บรรทัด**

---

## ⚡ ข้อดี

### 1. **ความเรียบง่าย**
- Code สั้นและอ่านง่ายกว่า
- ไม่ต้องกระโดดดูหลายไฟล์
- เหมาะสำหรับเรียนรู้

### 2. **Development เร็วขึ้น**
- เพิ่ม feature ใหม่เร็วกว่า
- Debug ง่ายกว่า (เห็น flow ทั้งหมดที่เดียว)
- แก้บัคเร็วกว่า

### 3. **Less Boilerplate**
- ไม่ต้องสร้าง DTO, Response struct ซ้ำๆ
- ไม่ต้อง convert model → response หลายครั้ง
- ไม่ต้องเขียน interface

---

## ⚠️ ข้อควรระวัง

### 1. **Business Logic ซับซ้อน**
หาก logic มีหลายขั้นตอน ควรแยกเป็น private function

```go
// ❌ Bad: ยัดทุกอย่างใน handler
func (h *Handler) Create(c *fiber.Ctx) error {
    // 100 บรรทัด logic ที่ซับซ้อน
}

// ✅ Good: แยก logic ออกมา
func (h *Handler) Create(c *fiber.Ctx) error {
    // Parse & validate
    data := h.parseRequest(c)

    // Business logic
    result := h.processData(data)

    // Save
    h.save(result)

    return response
}

func (h *Handler) processData(data Data) Result {
    // Complex logic here
}
```

### 2. **Code Reuse**
ถ้ามี logic ที่ใช้หลายที่ ให้ย้ายไปที่ utils หรือ helpers

```go
// ✅ Good: สร้าง helper function
package helpers

func CheckDuplicateEmail(db *gorm.DB, email string) bool {
    var count int64
    db.Model(&models.User{}).Where("email = ?", email).Count(&count)
    return count > 0
}

// ใช้ใน handler
if helpers.CheckDuplicateEmail(h.DB, req.Email) {
    return utils.ConflictResponse(c, "Email exists")
}
```

---

## 🚀 การใช้งาน

### Run Server
```bash
cd backend
go run main.go
```

### Test API
```bash
# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@silpakorn.edu","password":"admin123"}'

# Get Buildings
curl http://localhost:8080/api/v1/buildings

# Create Building (Admin only)
curl -X POST http://localhost:8080/api/v1/buildings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"อาคาร Test","description":"ทดสอบ"}'
```

---

## 📚 สรุป

### เหมาะกับ
- ✅ โปรเจกต์เรียนรู้
- ✅ CRUD ง่ายๆ
- ✅ Prototype / MVP
- ✅ โปรเจกต์ขนาดเล็ก-กลาง

### ไม่เหมาะกับ
- ❌ Business logic ซับซ้อนมาก
- ❌ ต้อง reuse logic หลายที่
- ❌ มีหลาย data source
- ❌ ทีมใหญ่ที่ต้อง strict architecture

---

## 📖 อ่านเพิ่มเติม

- [ARCHITECTURE_SIMPLE.md](./ARCHITECTURE_SIMPLE.md) - คำอธิบายแบบละเอียด
- [API_TESTING.md](./API_TESTING.md) - วิธี test API
- [BACKEND_PLAN.md](../docs/planning/BACKEND_PLAN.md) - แผนพัฒนาทั้งหมด
