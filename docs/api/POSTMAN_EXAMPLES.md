# Postman API Testing Examples

คู่มือตัวอย่าง JSON สำหรับทดสอบ API ทุกเส้นด้วย Postman

---

## 📋 Table of Contents

- [Setup & Environment](#setup--environment)
- [Authentication APIs](#authentication-apis)
- [Building APIs](#building-apis)
- [Room APIs](#room-apis)
- [Common Response Formats](#common-response-formats)

---

## Setup & Environment

### Base URL
```
http://localhost:3000
```

### Postman Environment Variables
สร้าง Environment ใน Postman และเพิ่มตัวแปรเหล่านี้:

| Variable | Initial Value | Current Value |
|----------|--------------|---------------|
| `base_url` | `http://localhost:3000` | `http://localhost:3000` |
| `access_token` | | (จะถูกตั้งค่าหลัง login) |
| `user_id` | | (จะถูกตั้งค่าหลัง login) |

### Auto-save Token Script
หลังจาก login สำเร็จ เพิ่ม script นี้ใน **Tests** tab ของ Postman:

```javascript
// Parse response
const response = pm.response.json();

// Save tokens to environment
if (response.data && response.data.tokens) {
    pm.environment.set("access_token", response.data.tokens.access_token);
}

// Save user info
if (response.data && response.data.user) {
    pm.environment.set("user_id", response.data.user.id);
}
```

---

## Authentication APIs

### 1. POST /api/v1/auth/register

**คำอธิบาย:** ลงทะเบียนผู้ใช้ใหม่

**Method:** `POST`

**URL:** `{{base_url}}/api/v1/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john.doe@su.ac.th",
  "password": "password123",
  "fullname": "John Doe",
  "username": "johndoe"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "email": "john.doe@su.ac.th",
    "fullname": "John Doe",
    "role": {
      "id": 3,
      "name": "Visitor"
    },
    "created_at": "2026-01-19T10:30:00Z"
  }
}
```

**Error Response (409 Conflict) - Email ซ้ำ:**
```json
{
  "success": false,
  "message": "Email already exists",
  "error": {
    "code": "CONFLICT",
    "details": null
  }
}
```

**Error Response (400 Bad Request) - Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "must be a valid silpakorn email"
      }
    ]
  }
}
```

---

### 2. POST /api/v1/auth/login

**คำอธิบาย:** เข้าสู่ระบบด้วย email และ password

**Method:** `POST`

**URL:** `{{base_url}}/api/v1/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john.doe@su.ac.th",
  "password": "password123"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "john.doe@su.ac.th",
      "fullname": "John Doe",
      "role": {
        "id": 3,
        "name": "Visitor"
      },
      "created_at": "2026-01-19T10:30:00Z"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "Bearer"
    }
  }
}
```

**Error Response (404 Not Found) - User ไม่มีในระบบ:**
```json
{
  "success": false,
  "message": "User with this email does not exist",
  "error": {
    "code": "USER_NOT_FOUND",
    "details": null
  }
}
```

**Error Response (401 Unauthorized) - Password ผิด:**
```json
{
  "success": false,
  "message": "Invalid email or password",
  "error": {
    "code": "INVALID_CREDENTIALS",
    "details": null
  }
}
```

---

### 3. GET /api/v1/auth/me

**คำอธิบาย:** ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่

**Method:** `GET`

**URL:** `{{base_url}}/api/v1/auth/me`

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Request Body:** ไม่มี

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "email": "john.doe@su.ac.th",
    "fullname": "John Doe",
    "role": {
      "id": 3,
      "name": "Visitor"
    },
    "created_at": "2026-01-19T10:30:00Z"
  }
}
```

**Error Response (401 Unauthorized) - ไม่มี Token:**
```json
{
  "success": false,
  "message": "Missing or invalid token",
  "error": {
    "code": "UNAUTHORIZED",
    "details": null
  }
}
```

---

## Building APIs

### 4. GET /api/v1/buildings

**คำอธิบาย:** ดึงข้อมูลตึกทั้งหมด (Public)

**Method:** `GET`

**URL:** `{{base_url}}/api/v1/buildings`

**Headers:** ไม่จำเป็น

**Request Body:** ไม่มี

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "building_id": 1,
      "name": "อาคาร 1",
      "description": "อาคารเรียนรวม",
      "created_at": "2026-01-15T08:00:00Z"
    },
    {
      "building_id": 2,
      "name": "อาคาร 2",
      "description": "อาคารปฏิบัติการ",
      "created_at": "2026-01-16T09:00:00Z"
    }
  ]
}
```

---

### 5. GET /api/v1/buildings/:id

**คำอธิบาย:** ดึงข้อมูลตึกตาม ID (Public)

**Method:** `GET`

**URL:** `{{base_url}}/api/v1/buildings/1`

**Headers:** ไม่จำเป็น

**Request Body:** ไม่มี

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "building_id": 1,
    "name": "อาคาร 1",
    "description": "อาคารเรียนรวม",
    "created_at": "2026-01-15T08:00:00Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Building not found",
  "error": {
    "code": "NOT_FOUND",
    "details": null
  }
}
```

---

### 6. GET /api/v1/buildings/:id/rooms

**คำอธิบาย:** ดึงข้อมูลห้องทั้งหมดในตึกที่ระบุ (Public)

**Method:** `GET`

**URL:** `{{base_url}}/api/v1/buildings/1/rooms`

**Headers:** ไม่จำเป็น

**Request Body:** ไม่มี

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "room_id": 1,
      "building_id": 1,
      "name": "101",
      "capacity": 40,
      "description": "ห้องเรียนขนาดกลาง",
      "created_at": "2026-01-15T08:30:00Z",
      "building": {
        "building_id": 1,
        "name": "อาคาร 1",
        "description": "อาคารเรียนรวม",
        "created_at": "2026-01-15T08:00:00Z"
      }
    },
    {
      "room_id": 2,
      "building_id": 1,
      "name": "102",
      "capacity": 50,
      "description": "ห้องเรียนขนาดใหญ่",
      "created_at": "2026-01-15T08:31:00Z",
      "building": {
        "building_id": 1,
        "name": "อาคาร 1",
        "description": "อาคารเรียนรวม",
        "created_at": "2026-01-15T08:00:00Z"
      }
    }
  ]
}
```

---

### 7. POST /api/v1/buildings

**คำอธิบาย:** สร้างตึกใหม่ (Admin Only)

**Method:** `POST`

**URL:** `{{base_url}}/api/v1/buildings`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

**Request Body:**
```json
{
  "name": "อาคาร 3",
  "description": "อาคารห้องสมุด"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Building created successfully",
  "data": {
    "building_id": 3,
    "name": "อาคาร 3",
    "description": "อาคารห้องสมุด",
    "created_at": "2026-01-19T11:00:00Z"
  }
}
```

**Error Response (401 Unauthorized) - ไม่มี Token:**
```json
{
  "success": false,
  "message": "Missing or invalid token",
  "error": {
    "code": "UNAUTHORIZED",
    "details": null
  }
}
```

**Error Response (403 Forbidden) - ไม่ใช่ Admin:**
```json
{
  "success": false,
  "message": "Access denied. Admin role required.",
  "error": {
    "code": "FORBIDDEN",
    "details": null
  }
}
```

**Error Response (409 Conflict) - ชื่อซ้ำ:**
```json
{
  "success": false,
  "message": "Building name already exists",
  "error": {
    "code": "CONFLICT",
    "details": null
  }
}
```

---

### 8. PUT /api/v1/buildings/:id

**คำอธิบาย:** แก้ไขข้อมูลตึก (Admin Only)

**Method:** `PUT`

**URL:** `{{base_url}}/api/v1/buildings/3`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

**Request Body:**
```json
{
  "name": "อาคาร 3 (ปรับปรุงใหม่)",
  "description": "อาคารห้องสมุดและศูนย์การเรียนรู้"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Building updated successfully",
  "data": {
    "building_id": 3,
    "name": "อาคาร 3 (ปรับปรุงใหม่)",
    "description": "อาคารห้องสมุดและศูนย์การเรียนรู้",
    "created_at": "2026-01-19T11:00:00Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Building not found",
  "error": {
    "code": "NOT_FOUND",
    "details": null
  }
}
```

---

### 9. DELETE /api/v1/buildings/:id

**คำอธิบาย:** ลบตึก (Admin Only)

**Method:** `DELETE`

**URL:** `{{base_url}}/api/v1/buildings/3`

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Request Body:** ไม่มี

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Building deleted successfully",
  "data": null
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Building not found",
  "error": {
    "code": "NOT_FOUND",
    "details": null
  }
}
```

---

## Room APIs

### 10. GET /api/v1/rooms

**คำอธิบาย:** ดึงข้อมูลห้องทั้งหมด พร้อมข้อมูลตึก (Public)

**Method:** `GET`

**URL:** `{{base_url}}/api/v1/rooms`

**Headers:** ไม่จำเป็น

**Request Body:** ไม่มี

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "room_id": 1,
      "building_id": 1,
      "name": "101",
      "capacity": 40,
      "description": "ห้องเรียนขนาดกลาง",
      "created_at": "2026-01-15T08:30:00Z",
      "building": {
        "building_id": 1,
        "name": "อาคาร 1",
        "description": "อาคารเรียนรวม",
        "created_at": "2026-01-15T08:00:00Z"
      }
    },
    {
      "room_id": 2,
      "building_id": 1,
      "name": "102",
      "capacity": 50,
      "description": "ห้องเรียนขนาดใหญ่",
      "created_at": "2026-01-15T08:31:00Z",
      "building": {
        "building_id": 1,
        "name": "อาคาร 1",
        "description": "อาคารเรียนรวม",
        "created_at": "2026-01-15T08:00:00Z"
      }
    }
  ]
}
```

---

### 11. GET /api/v1/rooms/:id

**คำอธิบาย:** ดึงข้อมูลห้องตาม ID พร้อมข้อมูลตึก (Public)

**Method:** `GET`

**URL:** `{{base_url}}/api/v1/rooms/1`

**Headers:** ไม่จำเป็น

**Request Body:** ไม่มี

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "room_id": 1,
    "building_id": 1,
    "name": "101",
    "capacity": 40,
    "description": "ห้องเรียนขนาดกลาง",
    "created_at": "2026-01-15T08:30:00Z",
    "building": {
      "building_id": 1,
      "name": "อาคาร 1",
      "description": "อาคารเรียนรวม",
      "created_at": "2026-01-15T08:00:00Z"
    }
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Room not found",
  "error": {
    "code": "NOT_FOUND",
    "details": null
  }
}
```

---

### 12. POST /api/v1/rooms

**คำอธิบาย:** สร้างห้องใหม่ (Admin Only)

**Method:** `POST`

**URL:** `{{base_url}}/api/v1/rooms`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

**Request Body:**
```json
{
  "building_id": 1,
  "name": "103",
  "capacity": 30,
  "description": "ห้องปฏิบัติการคอมพิวเตอร์"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Room created successfully",
  "data": {
    "room_id": 3,
    "building_id": 1,
    "name": "103",
    "capacity": 30,
    "description": "ห้องปฏิบัติการคอมพิวเตอร์",
    "created_at": "2026-01-19T11:15:00Z",
    "building": {
      "building_id": 1,
      "name": "อาคาร 1",
      "description": "อาคารเรียนรวม",
      "created_at": "2026-01-15T08:00:00Z"
    }
  }
}
```

**Error Response (400 Bad Request) - Missing Field:**
```json
{
  "success": false,
  "message": "Building ID is required",
  "error": {
    "code": "BAD_REQUEST",
    "details": null
  }
}
```

**Error Response (404 Not Found) - Building ไม่มีในระบบ:**
```json
{
  "success": false,
  "message": "Building not found",
  "error": {
    "code": "NOT_FOUND",
    "details": null
  }
}
```

**Error Response (409 Conflict) - ชื่อห้องซ้ำในตึกเดียวกัน:**
```json
{
  "success": false,
  "message": "Room name already exists in this building",
  "error": {
    "code": "CONFLICT",
    "details": null
  }
}
```

---

### 13. PUT /api/v1/rooms/:id

**คำอธิบาย:** แก้ไขข้อมูลห้อง (Admin Only)

**Method:** `PUT`

**URL:** `{{base_url}}/api/v1/rooms/3`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{access_token}}
```

**Request Body:**
```json
{
  "building_id": 1,
  "name": "103A",
  "capacity": 35,
  "description": "ห้องปฏิบัติการคอมพิวเตอร์ขั้นสูง"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Room updated successfully",
  "data": {
    "room_id": 3,
    "building_id": 1,
    "name": "103A",
    "capacity": 35,
    "description": "ห้องปฏิบัติการคอมพิวเตอร์ขั้นสูง",
    "created_at": "2026-01-19T11:15:00Z",
    "building": {
      "building_id": 1,
      "name": "อาคาร 1",
      "description": "อาคารเรียนรวม",
      "created_at": "2026-01-15T08:00:00Z"
    }
  }
}
```

**Error Response (404 Not Found) - Room ไม่มีในระบบ:**
```json
{
  "success": false,
  "message": "Room not found",
  "error": {
    "code": "NOT_FOUND",
    "details": null
  }
}
```

---

### 14. DELETE /api/v1/rooms/:id

**คำอธิบาย:** ลบห้อง (Admin Only)

**Method:** `DELETE`

**URL:** `{{base_url}}/api/v1/rooms/3`

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Request Body:** ไม่มี

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Room deleted successfully",
  "data": null
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Room not found",
  "error": {
    "code": "NOT_FOUND",
    "details": null
  }
}
```

---

## Common Response Formats

### Success Response Structure
```json
{
  "success": true,
  "message": "Description of the result",
  "data": {
    // Response data object or array
  }
}
```

### Error Response Structure
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": null | object | array
  }
}
```

### Common HTTP Status Codes

| Status Code | Meaning | Example |
|------------|---------|---------|
| 200 | OK | GET, PUT, DELETE สำเร็จ |
| 201 | Created | POST สร้างข้อมูลสำเร็จ |
| 400 | Bad Request | Request body ไม่ถูกต้อง |
| 401 | Unauthorized | ไม่มี token หรือ token หมดอายุ |
| 403 | Forbidden | ไม่มีสิทธิ์เข้าถึง (ไม่ใช่ Admin) |
| 404 | Not Found | ไม่พบข้อมูล |
| 409 | Conflict | ข้อมูลซ้ำ (email, ชื่อ) |
| 500 | Internal Server Error | เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ |

---

## 📌 หมายเหตุสำคัญ

### Authentication
1. **Public Endpoints** (ไม่ต้องมี token):
   - GET /api/v1/buildings
   - GET /api/v1/buildings/:id
   - GET /api/v1/buildings/:id/rooms
   - GET /api/v1/rooms
   - GET /api/v1/rooms/:id
   - POST /api/v1/auth/login
   - POST /api/v1/auth/register

2. **Protected Endpoints** (ต้องมี token):
   - GET /api/v1/auth/me

3. **Admin Only Endpoints** (ต้องมี token + role = Admin):
   - POST /api/v1/buildings
   - PUT /api/v1/buildings/:id
   - DELETE /api/v1/buildings/:id
   - POST /api/v1/rooms
   - PUT /api/v1/rooms/:id
   - DELETE /api/v1/rooms/:id

### Token Usage
ใส่ token ใน Header ดังนี้:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Email Validation
- ระบบตรวจสอบว่า email ต้องเป็น Silpakorn University email (`@su.ac.th`)
- ใช้ custom validator `email_silpakorn`

### Role IDs
| ID | Role Name | Description |
|----|-----------|-------------|
| 1 | Admin | ผู้ดูแลระบบ |
| 2 | Staff | เจ้าหน้าที่ |
| 3 | Visitor | ผู้เยี่ยมชม (default) |

---

## 🚀 Quick Start Guide

### 1. Register a new user
```bash
POST /api/v1/auth/register
{
  "email": "test@su.ac.th",
  "password": "password123",
  "fullname": "Test User",
  "username": "testuser"
}
```

### 2. Login to get token
```bash
POST /api/v1/auth/login
{
  "email": "test@su.ac.th",
  "password": "password123"
}
```
**Copy `access_token` จาก response**

### 3. Test protected endpoint
```bash
GET /api/v1/auth/me
Headers: Authorization: Bearer {access_token}
```

### 4. For Admin endpoints
ต้องมี user ที่มี `role_id = 1` (Admin) ซึ่งต้องสร้างผ่าน seeder หรือ database โดยตรง

---

**สร้างโดย:** Claude Code
**วันที่:** 2026-01-19
**เวอร์ชัน:** 1.0.0
