# 🧪 API Testing - Quick Reference

คู่มือฉบับย่อสำหรับการทดสอบ Booking API

## 📋 วิธีทดสอบ (เลือก 1 จาก 3 วิธี)

### 1️⃣ Postman (แนะนำสำหรับมือใหม่)

**ข้อดี:** UI ใช้งานง่าย, บันทึก request ได้, auto-save token

**ขั้นตอน:**

```bash
1. เปิด Postman Desktop หรือ Postman Web
2. Import Collection: SU_Booking_Room_Postman_Collection.json
3. Import Environment: SU_Booking_Room_Postman_Environment.json
4. เลือก Environment: "SU Booking Room - Local"
5. รัน folder "1. Setup" เพื่อ login และเก็บ token อัตโนมัติ
6. ทดสอบ endpoints อื่นๆ ได้เลย!
```

**ไฟล์ที่ต้องใช้:**

- `docs/api/SU_Booking_Room_Postman_Collection.json`
- `docs/api/SU_Booking_Room_Postman_Environment.json`

**คู่มือเต็ม:** [BOOKING_API_TEST.md](BOOKING_API_TEST.md)

---

### 2️⃣ Bash Script (แนะนำสำหรับทดสอบอัตโนมัติ)

**ข้อดี:** รันทดสอบทุก endpoint พร้อมกันได้, เห็นผลทันที, ไม่ต้อง setup

**ขั้นตอน:**

```bash
# 1. ให้สิทธิ์ execute
chmod +x docs/api/test_booking_api.sh

# 2. รัน script
./docs/api/test_booking_api.sh
```

**ผลลัพธ์:**

- ✅ สีเขียว = ผ่าน
- ❌ สีแดง = ไม่ผ่าน
- ℹ️ สีเหลือง = ข้อมูล

**ทดสอบอะไรบ้าง:**

1. Login (Admin & User)
2. Get current user
3. Get buildings & rooms
4. Create booking (valid)
5. Create booking (conflict) - ควรล้มเหลว ✓
6. Create booking (invalid time) - ควรล้มเหลว ✓
7. Create booking (past date) - ควรล้มเหลว ✓
8. Get my bookings
9. Approve booking (Admin)
10. Cancel booking
11. Permission test (User accessing Admin endpoint)

---

### 3️⃣ curl (แนะนำสำหรับนักพัฒนา)

**ข้อดี:** ยืดหยุ่นสูง, เข้าใจ HTTP ลึกขึ้น

**ตัวอย่างพื้นฐาน:**

#### 1. Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@silpakorn.edu",
    "password": "admin123"
  }' | jq
```

#### 2. Create Booking

```bash
# เก็บ token ก่อน
TOKEN="your_access_token_here"

curl -X POST http://localhost:8000/api/v1/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": 1,
    "title": "ประชุมกลุ่ม",
    "detail": "ทดสอบจาก curl",
    "equipment_request": "โปรเจคเตอร์ 1 เครื่อง",
    "booking_date": "2026-01-25",
    "start_time": "14:00",
    "end_time": "16:00"
  }' | jq
```

#### 3. Get My Bookings

```bash
curl -X GET http://localhost:8000/api/v1/bookings/my \
  -H "Authorization: Bearer $TOKEN" | jq
```

#### 4. Get Room Availability

```bash
curl -X GET "http://localhost:8000/api/v1/rooms/1/availability?date=2026-01-25" | jq
```

---

## 📊 Endpoint Reference (ฉบับย่อ)

### 🔐 Authentication (Public)

| Method | Endpoint                | Description                      |
| ------ | ----------------------- | -------------------------------- |
| POST   | `/api/v1/auth/login`    | Login                            |
| POST   | `/api/v1/auth/register` | Register                         |
| GET    | `/api/v1/auth/me`       | Get current user (Auth required) |

### 🏢 Buildings (Public Read, Admin Write)

| Method | Endpoint                | Permission |
| ------ | ----------------------- | ---------- |
| GET    | `/api/v1/buildings`     | All        |
| GET    | `/api/v1/buildings/:id` | All        |
| POST   | `/api/v1/buildings`     | Admin      |
| PUT    | `/api/v1/buildings/:id` | Admin      |
| DELETE | `/api/v1/buildings/:id` | Admin      |

### 🚪 Rooms (Public Read, Admin Write)

| Method | Endpoint                         | Permission |
| ------ | -------------------------------- | ---------- |
| GET    | `/api/v1/rooms`                  | All        |
| GET    | `/api/v1/rooms/:id`              | All        |
| GET    | `/api/v1/rooms/:id/availability` | All        |
| POST   | `/api/v1/rooms`                  | Admin      |

### 📅 Bookings (Mixed Permissions)

| Method | Endpoint                      | Permission          |
| ------ | ----------------------------- | ------------------- |
| GET    | `/api/v1/bookings/my`         | Auth (own bookings) |
| GET    | `/api/v1/bookings`            | Admin               |
| GET    | `/api/v1/bookings/:id`        | Owner or Admin      |
| POST   | `/api/v1/bookings`            | Auth                |
| PATCH  | `/api/v1/bookings/:id/status` | Admin               |
| DELETE | `/api/v1/bookings/:id/cancel` | Owner or Admin      |

---

## 🔑 Default Users

### Admin

```
Email: admin@silpakorn.edu
Password: admin123
Role: Admin (can do everything)
```

### User

```
Email: user@silpakorn.edu
Password: user123
Role: Teacher (can book rooms)
```

---

## ✅ Validation Rules

### Booking Creation

- ✓ `start_time` < `end_time` (ห้ามเวลาเริ่มมากกว่าเวลาสิ้นสุด)
- ✓ `booking_date` >= today (ห้ามจองย้อนหลัง)
- ✓ No time overlap (ห้ามจองซ้อนกับการจองอื่น)
- ✓ No conflict with fixed schedules (ห้ามซ้อนกับตารางการจอง)

### Time Format

- Date: `YYYY-MM-DD` (เช่น `2026-01-25`)
- Time: `HH:MM` (เช่น `14:00`, `16:30`)

---

## ❌ Common Errors

### 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Start time must be before end time"
  }
}
```

**แก้:** ตรวจสอบ validation rules

### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid token"
  }
}
```

**แก้:** Login ใหม่และใส่ Bearer token

### 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

**แก้:** ใช้ Admin account สำหรับ endpoint ที่ต้องการสิทธิ์ Admin

### 409 Conflict

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Time slot already booked"
  }
}
```

**แก้:** เลือกเวลาอื่นที่ไม่ซ้อนทับ

---

## 🛠️ Troubleshooting

### Server ไม่ตอบสนอง

```bash
# ตรวจสอบว่า backend รันอยู่ไหม
curl http://localhost:8000/api/v1/health

# ถ้าไม่ได้ ให้ start server
cd backend && go run main.go
# หรือ
make dev-backend
```

### Database error

```bash
# Reset database
make db-reset

# ตรวจสอบ connection
make db-shell
```

### jq command not found (สำหรับ bash script)

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

---

## 📚 เอกสารเพิ่มเติม

- **[BOOKING_API_TEST.md](BOOKING_API_TEST.md)** - คู่มือเต็มพร้อม request/response examples
- **[README.md](README.md)** - ภาพรวมเอกสาร API Testing
- **[Backend README](../../backend/README.md)** - เอกสาร Backend API
- **[Root README](../../README.md)** - เอกสารโปรเจกต์ทั้งหมด

---

**Last Updated:** 2026-01-24
**Version:** 1.0.0
