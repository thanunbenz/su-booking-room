# 📧 คู่มือทดสอบการส่งอีเมล

## ✅ ใช่! มันส่งอีเมลจริงๆ ไปที่ SMTP Server (Gmail)

---

## 🚀 ขั้นตอนทดสอบ

### 1️⃣ **ตั้งค่า Gmail App Password**

#### ขั้นตอน:
1. เข้า [Google Account Settings](https://myaccount.google.com/)
2. ไปที่ **Security** → **2-Step Verification**
3. เปิด 2-Step Verification (ถ้ายังไม่ได้เปิด)
4. กด **App Passwords**
5. เลือก **Mail** → **Other (Custom name)** → ตั้งชื่อว่า "SU Booking Room"
6. Copy password ที่ได้ (16 หลัก)

---

### 2️⃣ **แก้ไข .env**

```bash
cd backend
cp .env.example .env
nano .env
```

**แก้ไขบรรทัดเหล่านี้:**
```env
# SMTP Configuration
SMTP_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com          # ← เปลี่ยนเป็น Gmail จริงๆ
SMTP_PASSWORD=xxxx xxxx xxxx xxxx           # ← ใส่ App Password ที่ copy
SMTP_FROM=SU Booking Room <noreply@silpakorn.edu>

# Frontend URL (สำหรับ links ในอีเมล)
APP_BASE_URL=http://localhost:3000
```

**บันทึกแล้วออกจาก nano:**
```
Ctrl + O (save)
Enter
Ctrl + X (exit)
```

---

### 3️⃣ **เริ่ม Server**

```bash
make dev
# หรือ
go run main.go
```

**Output ที่ควรเห็น:**
```
✅ SMTP Config loaded: smtp.gmail.com:587 (Workers: 3, Queue: 100)
✅ Email service initialized with 3 workers
🚀 Started 3 email workers
✅ Email, Notification, and Reminder services initialized
🚀 Server starting on port 8000
```

---

### 4️⃣ **Login และเอา JWT Token**

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@silpakorn.edu",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  ← Copy token นี้
    "user": {...}
  }
}
```

**บันทึก Token:**
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 5️⃣ **ทดสอบส่งอีเมล (สร้างการจอง)**

```bash
curl -X POST http://localhost:8000/api/v1/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": 1,
    "booking_date": "2026-03-15",
    "start_time": "09:00",
    "end_time": "12:00",
    "title": "Test Email Notification",
    "purpose": "ทดสอบการส่งอีเมล"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "booking_id": 1,
    "room_id": 1,
    "status": "approved",
    ...
  },
  "message": "Booking created successfully"
}
```

---

### 6️⃣ **ดูใน Terminal (Backend Logs)**

ควรเห็น logs แบบนี้:

```
✅ Notification created: ID=1, Type=booking_created, UserID=1, BookingID=1
📨 Email job queued: การจองห้องสำเร็จ -> admin@silpakorn.edu
👷 Email worker #1 started
📧 Email queued successfully for notification ID=1
✅ Worker #1: Email sent successfully to admin@silpakorn.edu (attempt 1)
```

---

### 7️⃣ **เช็คอีเมลใน Gmail**

**ไปที่ Gmail → Inbox:**

📧 **คุณจะได้รับอีเมล:**
- **From:** SU Booking Room <noreply@silpakorn.edu>
- **Subject:** การจองห้องสำเร็จ
- **Body:** HTML template สวยงาม พร้อมรายละเอียดการจอง

---

## 🧪 ทดสอบ Notification Types อื่นๆ

### ✅ **Booking Approved** (Admin only)

```bash
# Admin approves booking
curl -X PATCH http://localhost:8000/api/v1/bookings/1/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "status_note": "Approved by admin"
  }'
```

**อีเมลที่ได้รับ:** 🎉 การจองได้รับการอนุมัติแล้ว

---

### ❌ **Booking Rejected** (Admin only)

```bash
curl -X PATCH http://localhost:8000/api/v1/bookings/1/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "rejected",
    "status_note": "Room is under maintenance"
  }'
```

**อีเมลที่ได้รับ:** ❌ การจองถูกปฏิเสธ

---

### 🚫 **Booking Cancelled**

```bash
curl -X DELETE http://localhost:8000/api/v1/bookings/1/cancel \
  -H "Authorization: Bearer $TOKEN"
```

**อีเมลที่ได้รับ:** 🚫 การจองถูกยกเลิก

---

### ⏰ **Booking Reminder** (Automatic - Cron Job)

**จะส่งอัตโนมัติทุก 1 ชั่วโมง** สำหรับการจองที่จะเกิดขึ้นใน 24 ชม.

**ทดสอบด้วยตนเอง:**
```bash
# สร้างการจองวันพรุ่งนี้
curl -X POST http://localhost:8000/api/v1/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": 1,
    "booking_date": "2026-03-11",  ← พรุ่งนี้
    "start_time": "09:00",
    "end_time": "12:00",
    "title": "Test Reminder"
  }'

# รอ cron job run (ทุก 1 ชั่วโมง)
# หรือ restart server เพื่อให้ check ทันที
```

---

## 🔍 Troubleshooting

### ❌ ไม่ได้รับอีเมล?

**1. เช็ค SMTP Logs:**
```
# ดูใน terminal ที่รัน server
# ต้องเห็น:
✅ Worker #1: Email sent successfully
```

**2. เช็ค Gmail Spam Folder:**
- ไปดูใน **Spam** / **Junk**
- Mark as "Not Spam"

**3. เช็ค .env:**
```bash
cat .env | grep SMTP
# ต้องมี:
# SMTP_ENABLED=true
# SMTP_USERNAME=...
# SMTP_PASSWORD=...
```

**4. เช็ค Google Account Security:**
- Allow "Less secure app access" (ถ้า Gmail เก่า)
- หรือใช้ **App Password** (แนะนำ)

**5. ดู Error Logs:**
```bash
# ถ้าส่งไม่ได้จะเห็น error แบบนี้:
❌ Worker #1: Failed to send email to xxx@gmail.com (attempt 1/3): ...
🚨 Worker #1: Email to xxx@gmail.com FAILED after 3 attempts
```

---

## 📊 Check Notification Status

### API: ดู Notifications ที่ส่งแล้ว

```bash
curl -X GET http://localhost:8000/api/v1/notifications/my \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "notification_id": 1,
        "type": "booking_created",
        "message": "การจองห้อง ... สำเร็จ",
        "is_read": false,
        "email_sent": true,           ← ส่งอีเมลสำเร็จ
        "email_sent_at": "2026-03-10T...",
        "email_error": null,          ← ไม่มี error
        "created_at": "2026-03-10T..."
      }
    ],
    "total": 1,
    "unread_count": 1
  }
}
```

---

## 📧 ตัวอย่างอีเมลที่ได้รับ

### Email Template: Booking Created

```
From: SU Booking Room <noreply@silpakorn.edu>
To: admin@silpakorn.edu
Subject: การจองห้องสำเร็จ

---------------------------------------------------
🏫 SU BOOKING ROOM
ระบบจองห้อง | ภาควิชาคอมพิวเตอร์ มหาวิทยาลัยศิลปากร
---------------------------------------------------

✅ การจองของคุณได้รับการยืนยันแล้ว

สวัสดีคุณ Admin User,

การจองห้องของคุณได้รับการบันทึกในระบบเรียบร้อยแล้ว

📋 รายละเอียดการจอง
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
เลขที่การจอง:   #1
ห้อง:            CS Lab 1 (อาคาร IT)
หัวข้อ:          Test Email Notification
วันที่:          15 March 2026
เวลา:            09:00 - 12:00
สถานะ:           ✓ อนุมัติแล้ว
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 การจองของคุณได้รับการอนุมัติแล้ว!
คุณสามารถใช้ห้องตามวันเวลาที่กำหนดได้

[ดูรายละเอียดการจอง] (http://localhost:3000/my-bookings)

หากต้องการยกเลิกการจอง กรุณาเข้าสู่ระบบ
และยกเลิกผ่านหน้าจัดการการจองของคุณ

---------------------------------------------------
Silpakorn University
Computer Science Department

This is an automated message, please do not reply.
---------------------------------------------------
```

---

## ✅ สรุป

| Step | คำสั่ง | ผลลัพธ์ |
|------|--------|---------|
| 1 | ตั้งค่า Gmail App Password | ได้ password 16 หลัก |
| 2 | แก้ไข .env | กรอก SMTP credentials |
| 3 | รัน server | `make dev` |
| 4 | Login | ได้ JWT token |
| 5 | สร้างการจอง | POST /bookings |
| 6 | เช็ค logs | เห็น "Email sent successfully" |
| 7 | เช็ค Gmail | ได้รับอีเมล! 📧 |

---

**🎉 การส่งอีเมลทำงานจริง 100%!**
