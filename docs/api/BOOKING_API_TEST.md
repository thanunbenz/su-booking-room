# 🧪 Booking API Testing Guide

คู่มือการทดสอบ Booking API ผ่าน Postman และ curl

---

## 📋 Table of Contents

1. [Setup](#setup)
2. [Authentication](#authentication)
3. [Booking CRUD Operations](#booking-crud-operations)
4. [Test Scenarios](#test-scenarios)
5. [Common Errors](#common-errors)

---

## 🔧 Setup

### Postman Environment Variables

สร้าง Environment ใน Postman ชื่อ `SU Booking Room - Local` และเพิ่มตัวแปร:

```
Variable Name     | Initial Value              | Current Value
----------------- | -------------------------- | --------------------------
base_url          | http://localhost:8000      | http://localhost:8000
api_version       | /api/v1                    | /api/v1
access_token      |                            | (จะถูกตั้งค่าหลัง login)
admin_email       | admin@su.ac.th             | admin@su.ac.th
admin_password    | admin123                   | admin123
user_email        | user@su.ac.th              | user@su.ac.th
user_password     | user123                    | user123
```

### Base URL
```
{{base_url}}{{api_version}}
```
ตัวอย่าง: `http://localhost:8000/api/v1`

---

## 🔐 Authentication

### 1. Login (Admin)

**Request:**
```http
POST {{base_url}}{{api_version}}/auth/login
Content-Type: application/json

{
  "email": "{{admin_email}}",
  "password": "{{admin_password}}"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": 1,
      "email": "admin@su.ac.th",
      "username": "admin",
      "fullname": "Admin User",
      "role": {
        "role_id": 1,
        "name": "admin"
      }
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "Login successful"
}
```

**Postman Test Script:**
```javascript
// Save access token to environment
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("access_token", response.data.access_token);
    console.log("Access token saved:", response.data.access_token);
}
```

**curl:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@su.ac.th",
    "password": "admin123"
  }'
```

---

## 📝 Booking CRUD Operations

### 1. Get All Bookings (Admin Only)

**Request:**
```http
GET {{base_url}}{{api_version}}/bookings
Authorization: Bearer {{access_token}}
```

**Optional Query Parameters:**
- `status` - Filter by status (pending, approved, rejected, cancelled, completed)
- `room_id` - Filter by room ID
- `date` - Filter by booking date (YYYY-MM-DD)

**Example with filters:**
```http
GET {{base_url}}{{api_version}}/bookings?status=pending&date=2026-01-25
Authorization: Bearer {{access_token}}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "booking_id": 1,
      "user_id": 2,
      "room_id": 1,
      "title": "ประชุมกลุ่ม",
      "detail": "ประชุมโครงงาน SE",
      "equipment_request": "โปรเจคเตอร์ 1 เครื่อง",
      "booking_date": "2026-01-25",
      "start_time": "09:00:00",
      "end_time": "11:00:00",
      "status": "pending",
      "status_note": "",
      "created_at": "2026-01-24T10:30:00Z",
      "updated_at": "2026-01-24T10:30:00Z"
    }
  ],
  "message": "Success"
}
```

**curl:**
```bash
curl -X GET "http://localhost:8000/api/v1/bookings?status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 2. Get My Bookings (User)

**Request:**
```http
GET {{base_url}}{{api_version}}/bookings/my
Authorization: Bearer {{access_token}}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "booking_id": 1,
      "user_id": 2,
      "room_id": 1,
      "title": "ประชุมกลุ่ม",
      "detail": "ประชุมโครงงาน SE",
      "booking_date": "2026-01-25",
      "start_time": "09:00:00",
      "end_time": "11:00:00",
      "status": "pending"
    }
  ],
  "message": "Success"
}
```

**curl:**
```bash
curl -X GET http://localhost:8000/api/v1/bookings/my \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 3. Create Booking (User)

**Request:**
```http
POST {{base_url}}{{api_version}}/bookings
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "room_id": 1,
  "title": "ประชุมกลุ่ม",
  "detail": "ประชุมโครงงาน Software Engineering",
  "equipment_request": "โปรเจคเตอร์ 1 เครื่อง, คอมพิวเตอร์ 5 เครื่อง",
  "booking_date": "2026-01-25",
  "start_time": "09:00",
  "end_time": "11:00"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "booking_id": 1,
    "user_id": 2,
    "room_id": 1,
    "title": "ประชุมกลุ่ม",
    "detail": "ประชุมโครงงาน Software Engineering",
    "equipment_request": "โปรเจคเตอร์ 1 เครื่อง, คอมพิวเตอร์ 5 เครื่อง",
    "booking_date": "2026-01-25",
    "start_time": "09:00:00",
    "end_time": "11:00:00",
    "status": "pending",
    "created_at": "2026-01-24T10:30:00Z",
    "updated_at": "2026-01-24T10:30:00Z"
  },
  "message": "Booking created successfully"
}
```

**curl:**
```bash
curl -X POST http://localhost:8000/api/v1/bookings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": 1,
    "title": "ประชุมกลุ่ม",
    "detail": "ประชุมโครงงาน SE",
    "equipment_request": "โปรเจคเตอร์",
    "booking_date": "2026-01-25",
    "start_time": "09:00",
    "end_time": "11:00"
  }'
```

---

### 4. Get Booking by ID (User/Admin)

**Request:**
```http
GET {{base_url}}{{api_version}}/bookings/1
Authorization: Bearer {{access_token}}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking_id": 1,
    "user_id": 2,
    "room_id": 1,
    "title": "ประชุมกลุ่ม",
    "detail": "ประชุมโครงงาน SE",
    "booking_date": "2026-01-25",
    "start_time": "09:00:00",
    "end_time": "11:00:00",
    "status": "pending"
  },
  "message": "Success"
}
```

**curl:**
```bash
curl -X GET http://localhost:8000/api/v1/bookings/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 5. Update Booking Status (Admin Only)

**Request:**
```http
PATCH {{base_url}}{{api_version}}/bookings/1/status
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "status": "approved",
  "status_note": "อนุมัติแล้ว พร้อมใช้งาน"
}
```

**Valid Status Values:**
- `pending` - รอการอนุมัติ
- `approved` - อนุมัติแล้ว
- `rejected` - ปฏิเสธ
- `cancelled` - ยกเลิก
- `completed` - เสร็จสิ้น

**Response:**
```json
{
  "success": true,
  "data": {
    "booking_id": 1,
    "user_id": 2,
    "room_id": 1,
    "title": "ประชุมกลุ่ม",
    "status": "approved",
    "status_note": "อนุมัติแล้ว พร้อมใช้งาน",
    "updated_at": "2026-01-24T11:00:00Z"
  },
  "message": "Booking status updated successfully"
}
```

**curl:**
```bash
curl -X PATCH http://localhost:8000/api/v1/bookings/1/status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "status_note": "อนุมัติแล้ว"
  }'
```

---

### 6. Cancel Booking (User - Own Booking)

**Request:**
```http
DELETE {{base_url}}{{api_version}}/bookings/1/cancel
Authorization: Bearer {{access_token}}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking_id": 1,
    "status": "cancelled",
    "status_note": "Cancelled by user"
  },
  "message": "Booking cancelled successfully"
}
```

**curl:**
```bash
curl -X DELETE http://localhost:8000/api/v1/bookings/1/cancel \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 7. Delete Booking (Admin Only)

**Request:**
```http
DELETE {{base_url}}{{api_version}}/bookings/1
Authorization: Bearer {{access_token}}
```

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Booking deleted successfully"
}
```

**curl:**
```bash
curl -X DELETE http://localhost:8000/api/v1/bookings/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 8. Get Room Availability

**Request:**
```http
GET {{base_url}}{{api_version}}/rooms/1/availability?date=2026-01-25
```

**Note:** This endpoint is public (no authentication required)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "booking_id": 1,
      "room_id": 1,
      "title": "ประชุมกลุ่ม",
      "booking_date": "2026-01-25",
      "start_time": "09:00:00",
      "end_time": "11:00:00",
      "status": "approved"
    },
    {
      "booking_id": 2,
      "room_id": 1,
      "title": "สอบกลางภาค",
      "booking_date": "2026-01-25",
      "start_time": "13:00:00",
      "end_time": "16:00:00",
      "status": "pending"
    }
  ],
  "message": "Success"
}
```

**curl:**
```bash
curl -X GET "http://localhost:8000/api/v1/rooms/1/availability?date=2026-01-25"
```

---

## 🧪 Test Scenarios

### Scenario 1: Complete Booking Flow (Happy Path)

**Step 1: Login as User**
```http
POST {{base_url}}{{api_version}}/auth/login
{
  "email": "user@su.ac.th",
  "password": "user123"
}
```

**Step 2: Check Room Availability**
```http
GET {{base_url}}{{api_version}}/rooms/1/availability?date=2026-01-25
```

**Step 3: Create Booking**
```http
POST {{base_url}}{{api_version}}/bookings
Authorization: Bearer {{access_token}}
{
  "room_id": 1,
  "title": "ประชุมกลุ่ม",
  "booking_date": "2026-01-25",
  "start_time": "14:00",
  "end_time": "16:00"
}
```

**Step 4: Check My Bookings**
```http
GET {{base_url}}{{api_version}}/bookings/my
Authorization: Bearer {{access_token}}
```

**Step 5: Login as Admin**
```http
POST {{base_url}}{{api_version}}/auth/login
{
  "email": "admin@su.ac.th",
  "password": "admin123"
}
```

**Step 6: Approve Booking**
```http
PATCH {{base_url}}{{api_version}}/bookings/1/status
Authorization: Bearer {{access_token}}
{
  "status": "approved",
  "status_note": "อนุมัติแล้ว"
}
```

---

### Scenario 2: Time Conflict Detection

**Step 1: Create First Booking**
```http
POST {{base_url}}{{api_version}}/bookings
Authorization: Bearer {{access_token}}
{
  "room_id": 1,
  "title": "การจองที่ 1",
  "booking_date": "2026-01-25",
  "start_time": "09:00",
  "end_time": "11:00"
}
```

**Step 2: Try to Create Overlapping Booking (Should Fail)**
```http
POST {{base_url}}{{api_version}}/bookings
Authorization: Bearer {{access_token}}
{
  "room_id": 1,
  "title": "การจองที่ 2 (ซ้อนทับ)",
  "booking_date": "2026-01-25",
  "start_time": "10:00",
  "end_time": "12:00"
}
```

**Expected Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Time slot is already booked"
  }
}
```

---

### Scenario 3: Fixed Schedule Conflict

**Step 1: Check Room Schedules**
```http
GET {{base_url}}{{api_version}}/rooms/1/schedules
```

**Step 2: Try to Book During Fixed Schedule Time (Should Fail)**
```http
POST {{base_url}}{{api_version}}/bookings
Authorization: Bearer {{access_token}}
{
  "room_id": 1,
  "title": "การจองในเวลาเรียน",
  "booking_date": "2026-01-27",
  "start_time": "09:00",
  "end_time": "11:00"
}
```

**Expected Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Time slot conflicts with fixed schedule"
  }
}
```

---

### Scenario 4: Validation Tests

**Test 1: Missing Required Fields**
```http
POST {{base_url}}{{api_version}}/bookings
Authorization: Bearer {{access_token}}
{
  "room_id": 1,
  "title": ""
}
```

**Expected Error:**
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Missing required fields"
  }
}
```

---

**Test 2: Invalid Time (Start >= End)**
```http
POST {{base_url}}{{api_version}}/bookings
Authorization: Bearer {{access_token}}
{
  "room_id": 1,
  "title": "การจองผิด",
  "booking_date": "2026-01-25",
  "start_time": "11:00",
  "end_time": "09:00"
}
```

**Expected Error:**
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Start time must be before end time"
  }
}
```

---

**Test 3: Booking in the Past**
```http
POST {{base_url}}{{api_version}}/bookings
Authorization: Bearer {{access_token}}
{
  "room_id": 1,
  "title": "การจองย้อนหลัง",
  "booking_date": "2024-01-01",
  "start_time": "09:00",
  "end_time": "11:00"
}
```

**Expected Error:**
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Cannot book in the past"
  }
}
```

---

**Test 4: Room Not Found**
```http
POST {{base_url}}{{api_version}}/bookings
Authorization: Bearer {{access_token}}
{
  "room_id": 999,
  "title": "การจองห้องที่ไม่มี",
  "booking_date": "2026-01-25",
  "start_time": "09:00",
  "end_time": "11:00"
}
```

**Expected Error:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Room not found"
  }
}
```

---

### Scenario 5: Permission Tests

**Test 1: User Cannot Access All Bookings**
```http
GET {{base_url}}{{api_version}}/bookings
Authorization: Bearer {{user_access_token}}
```

**Expected Error:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Forbidden: Admin access required"
  }
}
```

---

**Test 2: User Cannot Update Booking Status**
```http
PATCH {{base_url}}{{api_version}}/bookings/1/status
Authorization: Bearer {{user_access_token}}
{
  "status": "approved"
}
```

**Expected Error:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Forbidden: Admin access required"
  }
}
```

---

**Test 3: User Cannot View Other User's Booking**
```http
GET {{base_url}}{{api_version}}/bookings/999
Authorization: Bearer {{user_access_token}}
```

**Expected Error (if booking belongs to another user):**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to view this booking"
  }
}
```

---

## ❌ Common Errors

### 1. Missing Authorization Token
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing authorization header"
  }
}
```

### 2. Invalid Token
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

### 3. Invalid Request Body
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request body"
  }
}
```

### 4. Time Slot Already Booked
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Time slot is already booked"
  }
}
```

### 5. Fixed Schedule Conflict
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Time slot conflicts with fixed schedule"
  }
}
```

---

## 📦 Postman Collection

### Import this JSON into Postman:

```json
{
  "info": {
    "name": "SU Booking Room - Booking API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login (Admin)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 200) {",
                  "    const response = pm.response.json();",
                  "    pm.environment.set(\"access_token\", response.data.access_token);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"{{admin_email}}\",\n  \"password\": \"{{admin_password}}\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{base_url}}{{api_version}}/auth/login",
              "host": ["{{base_url}}{{api_version}}"],
              "path": ["auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "Bookings",
      "item": [
        {
          "name": "Get All Bookings (Admin)",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{access_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}{{api_version}}/bookings",
              "host": ["{{base_url}}{{api_version}}"],
              "path": ["bookings"]
            }
          }
        },
        {
          "name": "Get My Bookings",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{access_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}{{api_version}}/bookings/my",
              "host": ["{{base_url}}{{api_version}}"],
              "path": ["bookings", "my"]
            }
          }
        },
        {
          "name": "Create Booking",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{access_token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"room_id\": 1,\n  \"title\": \"ประชุมกลุ่ม\",\n  \"detail\": \"ประชุมโครงงาน SE\",\n  \"equipment_request\": \"โปรเจคเตอร์\",\n  \"booking_date\": \"2026-01-25\",\n  \"start_time\": \"09:00\",\n  \"end_time\": \"11:00\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{base_url}}{{api_version}}/bookings",
              "host": ["{{base_url}}{{api_version}}"],
              "path": ["bookings"]
            }
          }
        },
        {
          "name": "Update Booking Status (Admin)",
          "request": {
            "method": "PATCH",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{access_token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"status\": \"approved\",\n  \"status_note\": \"อนุมัติแล้ว\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{base_url}}{{api_version}}/bookings/1/status",
              "host": ["{{base_url}}{{api_version}}"],
              "path": ["bookings", "1", "status"]
            }
          }
        },
        {
          "name": "Cancel Booking",
          "request": {
            "method": "DELETE",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{access_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}{{api_version}}/bookings/1/cancel",
              "host": ["{{base_url}}{{api_version}}"],
              "path": ["bookings", "1", "cancel"]
            }
          }
        },
        {
          "name": "Get Room Availability",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}{{api_version}}/rooms/1/availability?date=2026-01-25",
              "host": ["{{base_url}}{{api_version}}"],
              "path": ["rooms", "1", "availability"],
              "query": [
                {
                  "key": "date",
                  "value": "2026-01-25"
                }
              ]
            }
          }
        }
      ]
    }
  ]
}
```

---

## 🎯 Testing Checklist

- [ ] Login as Admin
- [ ] Login as User
- [ ] Create booking (success)
- [ ] Create booking with time conflict (should fail)
- [ ] Create booking with fixed schedule conflict (should fail)
- [ ] Create booking in the past (should fail)
- [ ] Create booking with invalid time range (should fail)
- [ ] Get my bookings
- [ ] Get all bookings (admin only)
- [ ] Get booking by ID
- [ ] Check room availability
- [ ] Approve booking (admin only)
- [ ] Reject booking (admin only)
- [ ] Cancel own booking
- [ ] Delete booking (admin only)
- [ ] Test permission errors (user accessing admin endpoints)

---

## 📝 Notes

1. **Token Expiration:** Access tokens expire after 24 hours. Login again to get a new token.
2. **Time Format:** Use 24-hour format (HH:MM) for start_time and end_time
3. **Date Format:** Use ISO format (YYYY-MM-DD) for booking_date
4. **Status Values:** Only use valid status values (pending, approved, rejected, cancelled, completed)
5. **Permissions:** Some endpoints require admin role, some require authenticated user

---

**Last Updated:** 2026-01-24
**Version:** 1.0.0
