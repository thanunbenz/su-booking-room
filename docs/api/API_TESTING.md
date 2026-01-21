# 🧪 API Testing Guide - Phase 3 (Login & Register)

## 🚀 การเริ่มต้น

### 1. ตรวจสอบ Environment Variables

ตรวจสอบไฟล์ `.env` ต้องมี:
```env
JWT_SECRET=your-super-secret-key-change-this-in-production
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=su_booking_room
```

### 2. รัน Server

```bash
cd backend
go run main.go
```

ถ้าสำเร็จจะเห็น:
```
🌱 Starting database seeding...
✓ Created role: admin
✓ Created role: teacher
✓ Created role: visitor
✓ Created admin user:
  Email: admin@silpakorn.edu
  Password: admin123
  Role: Admin
✅ Database seeding completed!
🚀 Server starting on port 8000
📡 API available at http://localhost:8000/api/v1
```

---

## 📋 API Endpoints

### 1. Health Check
```bash
GET http://localhost:8000/api/v1/health
```

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

### 2. 🔐 Login

```bash
POST http://localhost:8000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@silpakorn.edu",
  "password": "admin123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@silpakorn.edu",
      "full_name": "Admin Silpakorn",
      "role": {
        "id": 1,
        "name": "admin"
      },
      "created_at": "2024-01-15T10:30:00Z"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "Bearer",
      "expires_in": 86400
    }
  }
}
```

**Error Responses:**

**401 - Invalid Password:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": null
  }
}
```

**404 - User Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with this email does not exist",
    "details": null
  }
}
```

**400 - Validation Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      },
      {
        "field": "password",
        "message": "Password must be at least 6 characters"
      }
    ]
  }
}
```

---

### 3. 📝 Register (สร้าง User ใหม่)

```bash
POST http://localhost:8000/api/v1/auth/register
Content-Type: application/json

{
  "email": "teacher@silpakorn.edu",
  "password": "password123",
  "full_name": "อาจารย์สมชาย ใจดี",
  "role_id": 2
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 2,
    "email": "teacher@silpakorn.edu",
    "full_name": "อาจารย์สมชาย ใจดี",
    "role": {
      "id": 2,
      "name": "teacher"
    },
    "created_at": "2024-01-15T11:00:00Z"
  }
}
```

**Error Responses:**

**409 - Email Already Exists:**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Email already exists",
    "details": null
  }
}
```

**Role IDs:**
- `1` = Admin
- `2` = Teacher
- `3` = Visitor

---

### 4. 👤 Get Current User (ต้อง Login ก่อน)

```bash
GET http://localhost:8000/api/v1/auth/me
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "email": "admin@silpakorn.edu",
    "full_name": "Admin Silpakorn",
    "role": {
      "id": 1,
      "name": "admin"
    },
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Response:**

**401 - No Token:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing authorization header",
    "details": null
  }
}
```

**401 - Invalid Token:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "details": null
  }
}
```

---

## 🧪 ทดสอบด้วย cURL

### 1. Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@silpakorn.edu",
    "password": "admin123"
  }'
```

### 2. Register
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@silpakorn.edu",
    "password": "password123",
    "full_name": "อาจารย์สมชาย ใจดี",
    "role_id": 2
  }'
```

### 3. Get Me (ใช้ token จาก login)
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📱 ทดสอบด้วย Postman / Thunder Client

### Collection Setup

**Base URL:** `http://localhost:8000/api/v1`

### Request 1: Login
- **Method:** POST
- **URL:** `{{base_url}}/auth/login`
- **Body (JSON):**
```json
{
  "email": "admin@silpakorn.edu",
  "password": "admin123"
}
```
- **Tests:** Save `access_token` to environment variable

### Request 2: Get Me
- **Method:** GET
- **URL:** `{{base_url}}/auth/me`
- **Headers:**
  - `Authorization`: `Bearer {{access_token}}`

### Request 3: Register
- **Method:** POST
- **URL:** `{{base_url}}/auth/register`
- **Body (JSON):**
```json
{
  "email": "teacher@silpakorn.edu",
  "password": "password123",
  "full_name": "อาจารย์สมชาย ใจดี",
  "role_id": 2
}
```

---

## ✅ Test Cases ที่ต้องผ่าน

### Login Tests
- [x] Login สำเร็จด้วย admin user
- [x] Login ผิดพลาดเมื่อ password ไม่ถูกต้อง
- [x] Login ผิดพลาดเมื่อ email ไม่มีในระบบ
- [x] Validation error เมื่อไม่ใส่ email
- [x] Validation error เมื่อ password สั้นกว่า 6 ตัว

### Register Tests
- [x] Register สำเร็จสร้าง teacher user
- [x] Register สำเร็จสร้าง visitor user
- [x] Register ผิดพลาดเมื่อ email ซ้ำ
- [x] Validation error เมื่อข้อมูลไม่ครบ

### Get Me Tests
- [x] Get me สำเร็จเมื่อมี valid token
- [x] Get me ผิดพลาดเมื่อไม่มี token
- [x] Get me ผิดพลาดเมื่อ token หมดอายุ
- [x] Get me ผิดพลาดเมื่อ token ไม่ถูกต้อง

---

## 🎯 Phase 3 Checklist

- [x] ✅ user_repository.go
- [x] ✅ auth_service.go
- [x] ✅ auth_handler.go
- [x] ✅ routes.go (auth endpoints)
- [x] ✅ seeder.go (admin user)
- [ ] 🧪 ทดสอบ API ทั้งหมด
- [ ] ✅ ยืนยันว่า Phase 3 เสร็จสมบูรณ์

---

## 🐛 Troubleshooting

### ปัญหา: Server ไม่ start
```bash
# ตรวจสอบ port 8000 ว่าถูกใช้งานอยู่หรือไม่
lsof -i :8000

# Kill process ที่ใช้ port 8000
kill -9 <PID>
```

### ปัญหา: Database connection error
- ตรวจสอบ PostgreSQL running หรือไม่
- ตรวจสอบ `.env` credentials
- ตรวจสอบ database `su_booking_room` สร้างแล้ว

### ปัญหา: JWT token invalid
- ตรวจสอบ `JWT_SECRET` ใน `.env`
- ตรวจสอบว่าใส่ `Bearer ` (มีเว้นวรรค) ข้างหน้า token

---

**Happy Testing! 🚀**
