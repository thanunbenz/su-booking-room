# 🚀 สร้างโปรเจคแบบนี้ใหม่จากศูนย์

คู่มือสำหรับสร้างโปรเจค Go + Fiber Backend แบบ Simple MVC Architecture

---

## 📋 Table of Contents
1. [เตรียมเครื่อง](#1-เตรียมเครื่อง)
2. [สร้าง Backend](#2-สร้าง-backend)
3. [สร้าง Database Models](#3-สร้าง-database-models)
4. [สร้าง Utils](#4-สร้าง-utils)
5. [สร้าง Middleware](#5-สร้าง-middleware)
6. [สร้าง Handlers](#6-สร้าง-handlers)
7. [สร้าง Routes](#7-สร้าง-routes)
8. [Setup Main](#8-setup-main)
9. [Docker Setup](#9-docker-setup)
10. [ทดสอบ](#10-ทดสอบ)

---

## 1. เตรียมเครื่อง

### ติดตั้ง Dependencies
```bash
# macOS
brew install go postgresql docker docker-compose

# ตรวจสอบเวอร์ชั่น
go version      # ควรเป็น 1.21+
psql --version  # ควรเป็น 14+
docker --version
```

---

## 2. สร้าง Backend

### สร้างโครงสร้างโปรเจค
```bash
# สร้าง directory
mkdir -p my-project/backend
cd my-project/backend

# Initialize Go module
go mod init github.com/username/my-project

# สร้างโครงสร้าง
mkdir -p internal/{config,models,handlers,routes,middleware,utils,seed}
```

### ติดตั้ง Dependencies
```bash
# Web framework
go get github.com/gofiber/fiber/v2

# Database
go get gorm.io/gorm
go get gorm.io/driver/postgres

# JWT & Security
go get github.com/golang-jwt/jwt/v5
go get golang.org/x/crypto/bcrypt

# Utilities
go get github.com/go-playground/validator/v10
go get github.com/joho/godotenv
```

---

## 3. สร้าง Database Models

### `internal/models/role.go`
```go
package models

type Role struct {
    RoleID   int    `gorm:"primaryKey;autoIncrement" json:"role_id"`
    RoleName string `gorm:"type:varchar(50);uniqueIndex;not null" json:"role_name"`
}

func (Role) TableName() string {
    return "roles"
}
```

### `internal/models/users.go`
```go
package models

import "time"

type User struct {
    UserID    int       `gorm:"primaryKey;autoIncrement" json:"user_id"`
    RoleID    int       `gorm:"not null;index" json:"role_id"`
    Fullname  string    `gorm:"type:varchar(255);not null" json:"fullname"`
    Email     string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
    Username  string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"username"`
    Password  string    `gorm:"type:varchar(255);not null" json:"-"`
    CreatedAt time.Time `gorm:"default:now()" json:"created_at"`
    UpdatedAt time.Time `gorm:"default:now()" json:"updated_at"`

    Role Role `gorm:"foreignKey:RoleID;references:RoleID" json:"role"`
}

func (User) TableName() string {
    return "users"
}
```

### สร้าง Models อื่นๆ ตาม Pattern เดียวกัน
- `building.go`, `room.go`, `booking.go` เป็นต้น

---

## 4. สร้าง Utils

### `internal/utils/password.go`
```go
package utils

import "golang.org/x/crypto/bcrypt"

func HashPassword(password string) (string, error) {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
    return string(bytes), err
}

func ComparePassword(hashedPassword, password string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
    return err == nil
}
```

### `internal/utils/jwt.go`
```go
package utils

import (
    "os"
    "time"
    "github.com/golang-jwt/jwt/v5"
)

func GenerateToken(userID uint, roleID uint, fullName string) (string, error) {
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
        "user_id":    userID,
        "role_id":    roleID,
        "full_name":  fullName,
        "token_type": "access",
        "exp":        jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
    })

    return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

func GenerateRefreshToken(userID uint, roleID uint, fullName string) (string, error) {
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
        "user_id":    userID,
        "role_id":    roleID,
        "full_name":  fullName,
        "token_type": "refresh",
        "exp":        jwt.NewNumericDate(time.Now().Add(168 * time.Hour)), // 7 days
    })

    return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}
```

### `internal/utils/response.go`
```go
package utils

import "github.com/gofiber/fiber/v2"

func StandardResponse(c *fiber.Ctx, status int, data interface{}, message string) error {
    return c.Status(status).JSON(fiber.Map{
        "success": true,
        "message": message,
        "data":    data,
    })
}

func BadRequestResponse(c *fiber.Ctx, message string) error {
    return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
        "success": false,
        "message": message,
    })
}

func NotFoundResponse(c *fiber.Ctx, message string) error {
    return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
        "success": false,
        "message": message,
    })
}

func InternalServerErrorResponse(c *fiber.Ctx, message string) error {
    return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
        "success": false,
        "message": message,
    })
}
```

### `internal/utils/validator.go`
```go
package utils

import "github.com/go-playground/validator/v10"

var validate = validator.New()

func ValidateStruct(data interface{}) map[string]string {
    err := validate.Struct(data)
    if err == nil {
        return nil
    }

    errors := make(map[string]string)
    for _, err := range err.(validator.ValidationErrors) {
        errors[err.Field()] = err.Tag()
    }
    return errors
}
```

---

## 5. สร้าง Middleware

### `internal/middleware/auth.go`
```go
package middleware

import (
    "os"
    "strings"

    "github.com/gofiber/fiber/v2"
    "github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(c *fiber.Ctx) error {
    authHeader := c.Get("Authorization")
    if authHeader == "" {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "success": false,
            "message": "Missing authorization header",
        })
    }

    tokenString := strings.Replace(authHeader, "Bearer ", "", 1)

    token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
        return []byte(os.Getenv("JWT_SECRET")), nil
    })

    if err != nil || !token.Valid {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "success": false,
            "message": "Invalid token",
        })
    }

    claims := token.Claims.(jwt.MapClaims)
    c.Locals("user_id", uint(claims["user_id"].(float64)))
    c.Locals("role_id", uint(claims["role_id"].(float64)))

    return c.Next()
}
```

### `internal/middleware/role.go`
```go
package middleware

import "github.com/gofiber/fiber/v2"

const (
    RoleAdmin   = 1
    RoleTeacher = 2
    RoleVisitor = 3
)

func AdminOnly(c *fiber.Ctx) error {
    roleID := c.Locals("role_id").(uint)

    if roleID != RoleAdmin {
        return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
            "success": false,
            "message": "Admin access required",
        })
    }

    return c.Next()
}
```

---

## 6. สร้าง Handlers

### `internal/handlers/auth_handler.go`
```go
package handlers

import (
    "github.com/gofiber/fiber/v2"
    "github.com/username/my-project/internal/models"
    "github.com/username/my-project/internal/utils"
    "gorm.io/gorm"
)

type AuthHandler struct {
    DB *gorm.DB
}

func NewAuthHandler(db *gorm.DB) *AuthHandler {
    return &AuthHandler{DB: db}
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
    var req struct {
        Email    string `json:"email" validate:"required,email"`
        Password string `json:"password" validate:"required"`
    }

    if err := c.BodyParser(&req); err != nil {
        return utils.BadRequestResponse(c, "Invalid request")
    }

    var user models.User
    if err := h.DB.Preload("Role").Where("email = ?", req.Email).First(&user).Error; err != nil {
        return utils.NotFoundResponse(c, "User not found")
    }

    if !utils.ComparePassword(user.Password, req.Password) {
        return utils.BadRequestResponse(c, "Invalid credentials")
    }

    accessToken, _ := utils.GenerateToken(uint(user.UserID), uint(user.RoleID), user.Fullname)
    refreshToken, _ := utils.GenerateRefreshToken(uint(user.UserID), uint(user.RoleID), user.Fullname)

    return utils.StandardResponse(c, fiber.StatusOK, fiber.Map{
        "access_token":  accessToken,
        "refresh_token": refreshToken,
    }, "Login successful")
}
```

---

## 7. สร้าง Routes

### `internal/routes/routes.go`
```go
package routes

import (
    "github.com/gofiber/fiber/v2"
    "github.com/username/my-project/internal/handlers"
    "github.com/username/my-project/internal/middleware"
    "gorm.io/gorm"
)

func SetupRoutes(app *fiber.App, db *gorm.DB) {
    authHandler := handlers.NewAuthHandler(db)

    api := app.Group("/api/v1")

    // Auth routes
    auth := api.Group("/auth")
    auth.Post("/login", authHandler.Login)

    // Protected routes
    protected := api.Group("/", middleware.AuthMiddleware)
    protected.Get("/me", authHandler.GetMe)
}
```

---

## 8. Setup Main

### `internal/config/database.go`
```go
package config

import (
    "fmt"
    "log"
    "os"

    "gorm.io/driver/postgres"
    "gorm.io/gorm"
)

func InitDatabase() (*gorm.DB, error) {
    dsn := fmt.Sprintf(
        "host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
        os.Getenv("DB_HOST"),
        os.Getenv("DB_USER"),
        os.Getenv("DB_PASSWORD"),
        os.Getenv("DB_NAME"),
        os.Getenv("DB_PORT"),
    )

    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        return nil, err
    }

    log.Println("✅ Database connected successfully")
    return db, nil
}
```

### `main.go`
```go
package main

import (
    "log"
    "os"

    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/cors"
    "github.com/gofiber/fiber/v2/middleware/logger"
    "github.com/joho/godotenv"

    "github.com/username/my-project/internal/config"
    "github.com/username/my-project/internal/models"
    "github.com/username/my-project/internal/routes"
)

func main() {
    // Load .env
    godotenv.Load()

    // Initialize database
    db, err := config.InitDatabase()
    if err != nil {
        log.Fatal("❌ Failed to connect database:", err)
    }

    // Auto migrate
    db.AutoMigrate(
        &models.Role{},
        &models.User{},
    )

    // Initialize Fiber
    app := fiber.New()

    // Middleware
    app.Use(cors.New())
    app.Use(logger.New())

    // Setup routes
    routes.SetupRoutes(app, db)

    // Start server
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }

    log.Printf("🚀 Server running on port %s", port)
    log.Fatal(app.Listen(":" + port))
}
```

### `.env`
```env
# Database
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=myproject_db
DB_PORT=5432

# Server
PORT=8080

# JWT
JWT_SECRET=your-secret-key-change-this
```

---

## 9. Docker Setup

### `Dockerfile`
```dockerfile
FROM golang:1.25-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o server main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
```

### `docker-compose.yml`
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: yourpassword
      POSTGRES_DB: myproject_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      DB_HOST: postgres
      DB_USER: postgres
      DB_PASSWORD: yourpassword
      DB_NAME: myproject_db
      DB_PORT: 5432
      PORT: 8080
      JWT_SECRET: your-secret-key
    depends_on:
      - postgres

volumes:
  postgres_data:
```

---

## 10. ทดสอบ

### รัน Local
```bash
# Terminal 1: Start PostgreSQL
docker run -d -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=myproject_db \
  postgres:16-alpine

# Terminal 2: Run backend
go run main.go
```

### รันด้วย Docker
```bash
docker-compose up --build
```

### ทดสอบ API
```bash
# Health check
curl http://localhost:8080/api/v1/health

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

---

## 📚 Next Steps

1. เพิ่ม Models ตามที่ต้องการ
2. สร้าง Handlers สำหรับ CRUD operations
3. เพิ่ม Middleware สำหรับ logging, rate limiting
4. เขียน Tests
5. Setup CI/CD
6. Deploy to production

---

## 📖 เอกสารเพิ่มเติม

- **[ARCHITECTURE_SIMPLE.md](backend/ARCHITECTURE_SIMPLE.md)** - โครงสร้างโดยละเอียด
- **[QUICK_START_SIMPLE.md](backend/QUICK_START_SIMPLE.md)** - คู่มือเริ่มต้น
- **[REFACTOR_COMPARISON.md](backend/REFACTOR_COMPARISON.md)** - เปรียบเทียบ architectures

---

## 🎉 สรุป

ตอนนี้คุณมีโปรเจค Go + Fiber แบบ Simple MVC แล้ว!

**โครงสร้างที่ได้:**
```
✅ 2-Layer Architecture (Handler → Database)
✅ JWT Authentication
✅ Role-based Authorization
✅ Standard Response Format
✅ Validation
✅ Docker Support
✅ เรียนรู้ง่าย พัฒนาเร็ว
```

**เวลาที่ใช้:** ~30-60 นาที
**ความยาก:** ⭐⭐☆☆☆ (2/5)

Happy Coding! 🚀
