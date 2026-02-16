# 📡 API Testing Documentation

เอกสารและไฟล์สำหรับทดสอบ API ของระบบ SU Booking Room

---

## 📁 ไฟล์ในโฟลเดอร์นี้

### 1. **TESTING_WORKFLOW.md** 🔄

คู่มือเลือกวิธีทดสอบที่เหมาะสมกับสถานการณ์:

- เลือก testing method ตามสถานการณ์ (Development, Debug, CI/CD)
- Recommended workflow แต่ละ phase
- Decision tree และ testing checklist
- Best practices

### 2. **API_TESTING_QUICKREF.md** ⚡

คู่มือฉบับย่อสำหรับเริ่มต้นทดสอบอย่างรวดเร็ว:

- เลือกวิธีทดสอบที่เหมาะสม (Postman / Bash / curl)
- Endpoint reference ฉบับย่อ
- Common errors และวิธีแก้
- Default users และ validation rules

### 3. **BOOKING_API_TEST.md** 📖

คู่มือการทดสอบ Booking API อย่างละเอียด ประกอบด้วย:

- วิธี Setup Postman Environment
- ตัวอย่าง API Requests ทั้งหมดพร้อม Request/Response
- Test Scenarios (Happy Path, Error Cases, Validation Tests)
- Common Errors และวิธีแก้ไข
- ตัวอย่าง curl commands

### 4. **test_booking_api.sh** 🤖

Bash script สำหรับทดสอบอัตโนมัติ:

- รันทดสอบ 16 scenarios พร้อมกัน
- Color-coded output (✅ สีเขียว = ผ่าน, ❌ สีแดง = ไม่ผ่าน)
- Auto login และเก็บ token
- ทดสอบ validation, permission, และ error cases
- ต้องติดตั้ง `jq` (JSON formatter)

### 5. **SU_Booking_Room_Postman_Collection.json** 📦

Postman Collection ที่พร้อมใช้งาน ประกอบด้วย:

- Authentication endpoints (Login Admin/User)
- Booking endpoints สำหรับ User
- Booking endpoints สำหรับ Admin
- Room availability endpoints
- Helper endpoints (Buildings, Rooms, Schedules)
- Test scripts สำหรับ auto-save token

### 6. **SU_Booking_Room_Postman_Environment.json** 🔧

Postman Environment Variables สำหรับ Local development:

- `base_url`: http://localhost:8000
- `api_version`: /api/v1
- `admin_email`: admin@su.ac.th
- `admin_password`: admin123
- `access_token`: (auto-filled after login)
- และอื่นๆ

---

## 🚀 Quick Start

### 🌟 แนะนำให้อ่านก่อน: [API Testing Quick Reference](API_TESTING_QUICKREF.md)

---

### วิธีที่ 1: Bash Script (ทดสอบอัตโนมัติ - แนะนำ!)

**เหมาะสำหรับ:** รันทดสอบทุก endpoint พร้อมกัน, ไม่ต้อง setup

```bash
# 1. ติดตั้ง jq (ถ้ายังไม่มี)
brew install jq  # macOS
# หรือ
sudo apt-get install jq  # Ubuntu

# 2. ให้สิทธิ์ execute
chmod +x test_booking_api.sh

# 3. รัน script
./test_booking_api.sh
```

**ผลลัพธ์:**

- ✅ ทดสอบ 16 scenarios อัตโนมัติ
- 🎨 Color-coded output (เขียว = ผ่าน, แดง = ไม่ผ่าน)
- 🔍 ตรวจสอบ validation, permission, error handling
- 📊 แสดง JSON response ที่จัดรูปแบบแล้ว

---

### วิธีที่ 2: Import Postman Collection

1. **เปิด Postman**

2. **Import Collection:**
   - คลิก "Import" ที่มุมซ้ายบน
   - เลือกไฟล์ `SU_Booking_Room_Postman_Collection.json`
   - คลิก "Import"

3. **Import Environment:**
   - คลิก "Import" อีกครั้ง
   - เลือกไฟล์ `SU_Booking_Room_Postman_Environment.json`
   - คลิก "Import"

4. **เลือก Environment:**
   - ที่มุมขวาบน เลือก Environment: `SU Booking Room - Local`

5. **เริ่มทดสอบ:**
   - เปิด Collection `SU Booking Room API`
   - เริ่มจาก folder "1. Authentication" → "Login (Admin)"
   - กด Send → Access token จะถูก save อัตโนมัติ
   - ทดสอบ endpoints อื่นๆ ใน folder "2. Bookings - User" หรือ "3. Bookings - Admin"

---

### วิธีที่ 2: ใช้ curl (Command Line)

#### 1. Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@su.ac.th",
    "password": "admin123"
  }'
```

#### 2. Copy Access Token จาก response

#### 3. Create Booking

```bash
curl -X POST http://localhost:8000/api/v1/bookings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": 1,
    "title": "ประชุมกลุ่ม",
    "booking_date": "2026-01-28",
    "start_time": "14:00",
    "end_time": "16:00"
  }'
```

---

## 🧪 Test Scenarios

### Basic Flow (Happy Path)

1. **Login as User**

   ```
   POST /auth/login
   ```

2. **Check Room Availability**

   ```
   GET /rooms/1/availability?date=2026-01-28
   ```

3. **Create Booking**

   ```
   POST /bookings
   ```

4. **View My Bookings**

   ```
   GET /bookings/my
   ```

5. **Login as Admin**

   ```
   POST /auth/login (with admin credentials)
   ```

6. **Approve Booking**
   ```
   PATCH /bookings/1/status
   ```

---

### Error Scenarios

#### 1. Time Conflict

สร้างการจอง 2 รายการที่เวลาซ้อนทับกัน

```
POST /bookings (09:00-11:00)
POST /bookings (10:00-12:00) → ❌ Should fail with CONFLICT
```

#### 2. Fixed Schedule Conflict

จองในเวลาที่มีตารางการจอง

```
GET /rooms/1/schedules → Check schedules
POST /bookings (during class time) → ❌ Should fail with CONFLICT
```

#### 3. Invalid Time Range

```
POST /bookings (start_time: 17:00, end_time: 15:00) → ❌ Should fail
```

#### 4. Booking in the Past

```
POST /bookings (date: 2024-01-01) → ❌ Should fail
```

#### 5. Permission Test

```
GET /bookings (with user token, not admin) → ❌ Should fail with FORBIDDEN
```

---

## 📊 API Endpoints Summary

### Authentication

- `POST /auth/login` - Login
- `GET /auth/me` - Get current user

### Bookings (User)

- `GET /bookings/my` - Get my bookings
- `POST /bookings` - Create booking
- `GET /bookings/:id` - Get booking by ID
- `DELETE /bookings/:id/cancel` - Cancel own booking

### Bookings (Admin)

- `GET /bookings` - Get all bookings (with filters)
- `PATCH /bookings/:id/status` - Update booking status
- `DELETE /bookings/:id` - Delete booking

### Room Availability

- `GET /rooms/:id/availability` - Get room availability (Public)

---

## 🔑 Environment Variables

| Variable            | Description                           | Default Value         |
| ------------------- | ------------------------------------- | --------------------- |
| `base_url`          | Backend URL                           | http://localhost:8000 |
| `api_version`       | API version prefix                    | /api/v1               |
| `admin_email`       | Admin email for login                 | admin@su.ac.th        |
| `admin_password`    | Admin password                        | admin123              |
| `user_email`        | Regular user email                    | user@su.ac.th         |
| `user_password`     | Regular user password                 | user123               |
| `access_token`      | JWT access token (auto-filled)        | -                     |
| `user_access_token` | User's access token (auto-filled)     | -                     |
| `last_booking_id`   | Last created booking ID (auto-filled) | -                     |

---

## ✅ Testing Checklist

### Authentication Tests

- [ ] Login as Admin (success)
- [ ] Login as User (success)
- [ ] Login with wrong password (fail)
- [ ] Get current user with valid token
- [ ] Get current user with invalid token (fail)

### User Booking Tests

- [ ] Create booking (success)
- [ ] Create booking with time conflict (fail)
- [ ] Create booking with fixed schedule conflict (fail)
- [ ] Create booking in the past (fail)
- [ ] Create booking with invalid time range (fail)
- [ ] Get my bookings
- [ ] Get booking by ID (own booking)
- [ ] Cancel own booking

### Admin Booking Tests

- [ ] Get all bookings
- [ ] Get bookings filtered by status
- [ ] Get bookings filtered by room and date
- [ ] Approve booking
- [ ] Reject booking
- [ ] Delete booking

### Permission Tests

- [ ] User trying to access admin endpoints (fail)
- [ ] User trying to view other user's booking (fail)
- [ ] User trying to update booking status (fail)

### Room Availability Tests

- [ ] Get room availability (no auth required)
- [ ] Get room availability with date filter
- [ ] Get room availability without date filter

---

## 🐛 Common Issues

### Issue 1: "Missing authorization header"

**Solution:** Make sure you've logged in and the access_token is saved in environment variables

### Issue 2: "Invalid or expired token"

**Solution:** Login again to get a new token (tokens expire after 24 hours)

### Issue 3: "Time slot is already booked"

**Solution:** Check room availability first, choose a different time slot

### Issue 4: "Forbidden: Admin access required"

**Solution:** Login with admin credentials for admin-only endpoints

### Issue 5: "Cannot book in the past"

**Solution:** Use a future date (>= today)

---

## 📝 Tips

1. **Auto-save Token:** ใช้ Postman Test Scripts เพื่อ auto-save access_token
2. **Environment Switching:** สร้าง environments แยกสำหรับ Local, Staging, Production
3. **Collection Runner:** ใช้ Postman Collection Runner เพื่อรัน tests ทั้งหมดพร้อมกัน
4. **Variables:** ใช้ `{{variable}}` เพื่ออ้างอิงค่าจาก environment
5. **Date Format:** ใช้ YYYY-MM-DD สำหรับ booking_date, HH:MM สำหรับ start_time/end_time

---

## 🔗 Related Documentation

- 🔄 **[Testing Workflow](TESTING_WORKFLOW.md)** - คู่มือเลือกวิธีทดสอบที่เหมาะสม
- ⚡ **[API Testing Quick Reference](API_TESTING_QUICKREF.md)** - คู่มือฉบับย่อ (เริ่มที่นี่!)
- 📖 **[BOOKING_API_TEST.md](BOOKING_API_TEST.md)** - คู่มือการทดสอบโดยละเอียด
- 🖥️ **[Backend README](../../backend/README.md)** - เอกสาร Backend API
- 🚀 **[Quick Start Guide](../guides/QUICK_START.md)** - เริ่มต้นใช้งานระบบ
- 📚 **[Documentation Index](../README.md)** - เอกสารทั้งหมด

---

**Last Updated:** 2026-01-24
**Version:** 1.0.0
