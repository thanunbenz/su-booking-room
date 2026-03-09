# 🐶 MailHog - Email Testing Guide

**MailHog** = Email testing tool ที่จับอีเมลแสดงบน Web UI (ไม่ส่งอีเมลจริง)

---

## 🎯 ทำไมต้องใช้ MailHog?

✅ **ข้อดี:**
- ✅ ไม่ต้องตั้งค่า Gmail App Password
- ✅ ไม่มีค่าใช้จ่าย (ส่งได้ไม่จำกัด)
- ✅ ไม่มี rate limiting จาก Gmail
- ✅ ดูอีเมลผ่าน Web UI สวยงาม
- ✅ ดู HTML/Plain text/Source code ได้
- ✅ ทดสอบ template ได้ง่าย
- ✅ ไม่มีอีเมลจริงๆ รั่วไหล

❌ **ข้อเสีย:**
- ❌ ไม่ส่งอีเมลจริง (ใช้ทดสอบอย่างเดียว)

---

## 🚀 Quick Start (3 ขั้นตอน)

### 1️⃣ เริ่ม MailHog

```bash
# เริ่ม Docker services (Database + MailHog)
docker-compose up -d

# ตรวจสอบว่ารันแล้ว
docker ps
```

**Output ที่ควรเห็น:**
```
CONTAINER ID   IMAGE                    PORTS                    NAMES
abc123...      mailhog/mailhog:latest   0.0.0.0:1025->1025/tcp   su-booking-mailhog
                                        0.0.0.0:8025->8025/tcp
def456...      postgres:16-alpine       0.0.0.0:5432->5432/tcp   su-booking-postgres
```

---

### 2️⃣ ตั้งค่า .env

```bash
cd backend
cp .env.example .env
nano .env
```

**แก้ไขเฉพาะบรรทัดเหล่านี้:**
```env
# SMTP Email Configuration (MailHog)
SMTP_ENABLED=true
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM=SU Booking Room <noreply@silpakorn.edu>
```

**บันทึก:** `Ctrl+O` → `Enter` → `Ctrl+X`

---

### 3️⃣ เริ่ม Backend

```bash
make dev
# หรือ
go run main.go
```

**Output ที่ควรเห็น:**
```
✅ SMTP Config loaded: localhost:1025 (Workers: 3, Queue: 100)
✅ Email service initialized with 3 workers
🚀 Started 3 email workers
✅ Email, Notification, and Reminder services initialized
🚀 Server starting on port 8000
```

---

## 📧 ทดสอบส่งอีเมล

### วิธีที่ 1: สร้างการจอง (Trigger Notification)

```bash
# 1. Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@silpakorn.edu",
    "password": "password123"
  }' | jq '.data.token' -r
```

**Copy token ที่ได้:**
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

```bash
# 2. สร้างการจอง
curl -X POST http://localhost:8000/api/v1/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": 1,
    "booking_date": "2026-03-15",
    "start_time": "09:00",
    "end_time": "12:00",
    "title": "Test MailHog Email",
    "purpose": "ทดสอบระบบอีเมล"
  }'
```

**Output (Backend logs):**
```
✅ Notification created: ID=1, Type=booking_created, UserID=1
📨 Email job queued: การจองห้องสำเร็จ -> admin@silpakorn.edu
✅ Worker #1: Email sent successfully to admin@silpakorn.edu (attempt 1)
```

---

## 🌐 เปิด MailHog Web UI

### เปิด Browser:
```
http://localhost:8025
```

**หน้าตา MailHog UI:**
```
┌─────────────────────────────────────────────────┐
│ MailHog                                         │
├─────────────────────────────────────────────────┤
│ Inbox (1)                                       │
├─────────────────────────────────────────────────┤
│ From: SU Booking Room <noreply@silpakorn.edu> │
│ To:   admin@silpakorn.edu                       │
│ Subject: การจองห้องสำเร็จ                      │
│ Date: 2026-03-10 14:30:00                       │
├─────────────────────────────────────────────────┤
│ [View]  [Delete]  [Source]                      │
└─────────────────────────────────────────────────┘
```

---

## 🎨 Features ของ MailHog UI

### 1️⃣ **View Tabs**

คลิกที่อีเมลแล้วจะเห็น tabs:

- **📄 Plain Text** - ข้อความธรรมดา
- **🎨 HTML** - แสดง HTML template (สวยงาม)
- **📝 Source** - ดู raw email source
- **📎 MIME** - ดู MIME parts

---

### 2️⃣ **HTML Preview**

คลิก tab **HTML** เพื่อดูอีเมลแบบสวยงาม:

```
┌────────────────────────────────────────┐
│ 🏫 SU BOOKING ROOM                    │
│ ระบบจองห้อง | ภาควิชาคอมพิวเตอร์      │
├────────────────────────────────────────┤
│                                        │
│ ✅ การจองของคุณได้รับการยืนยันแล้ว   │
│                                        │
│ สวัสดีคุณ Admin User,                 │
│                                        │
│ การจองห้องของคุณได้รับการบันทึก       │
│ ในระบบเรียบร้อยแล้ว                   │
│                                        │
│ 📋 รายละเอียดการจอง                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ เลขที่การจอง:   #1                   │
│ ห้อง:            CS Lab 1 (อาคาร IT) │
│ หัวข้อ:          Test MailHog Email   │
│ วันที่:          15 March 2026        │
│ เวลา:            09:00 - 12:00        │
│ สถานะ:           ✓ อนุมัติแล้ว        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                        │
│ [ดูรายละเอียดการจอง]                  │
│                                        │
└────────────────────────────────────────┘
```

---

### 3️⃣ **Search & Filter**

- **Search box:** ค้นหาอีเมลตาม subject, from, to
- **Delete all:** ลบอีเมลทั้งหมด
- **Refresh:** โหลดอีเมลใหม่

---

## 🧪 ทดสอบ Notification Types ทั้งหมด

### ✅ Booking Created (สร้างการจอง)

```bash
curl -X POST http://localhost:8000/api/v1/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"room_id": 1, "booking_date": "2026-03-15", "start_time": "09:00", "end_time": "12:00", "title": "Test"}'
```

**→ ไป MailHog:** จะเห็นอีเมล "การจองห้องสำเร็จ"

---

### 🎉 Booking Approved (Admin อนุมัติ)

```bash
curl -X PATCH http://localhost:8000/api/v1/bookings/1/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved", "status_note": "Approved"}'
```

**→ ไป MailHog:** จะเห็นอีเมล "🎉 การจองได้รับการอนุมัติแล้ว"

---

### ❌ Booking Rejected (Admin ปฏิเสธ)

```bash
curl -X PATCH http://localhost:8000/api/v1/bookings/1/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "rejected", "status_note": "Room maintenance"}'
```

**→ ไป MailHog:** จะเห็นอีเมล "❌ การจองถูกปฏิเสธ"

---

### 🚫 Booking Cancelled (ยกเลิก)

```bash
curl -X DELETE http://localhost:8000/api/v1/bookings/1/cancel \
  -H "Authorization: Bearer $TOKEN"
```

**→ ไป MailHog:** จะเห็นอีเมล "🚫 การจองถูกยกเลิก"

---

### ⏰ Booking Reminder (แจ้งเตือนอัตโนมัติ)

จะส่งอัตโนมัติทุก 1 ชั่วโมงสำหรับการจองที่จะเกิดขึ้นใน 24 ชม.

**ทดสอบด้วยตนเอง:**
```bash
# สร้างการจองวันพรุ่งนี้
curl -X POST http://localhost:8000/api/v1/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": 1,
    "booking_date": "2026-03-11",
    "start_time": "10:00",
    "end_time": "12:00",
    "title": "Test Reminder"
  }'

# รอ cron job หรือ restart server
```

**→ ไป MailHog:** จะเห็นอีเมล "⏰ แจ้งเตือน: การจองใกล้ถึงกำหนด"

---

## 📊 ตรวจสอบ Email Status

```bash
# ดู notifications ที่ส่งแล้ว
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
        "email_sent": true,        ← ส่งสำเร็จ
        "email_sent_at": "2026-03-10T14:30:00Z",
        "email_error": null        ← ไม่มี error
      }
    ],
    "unread_count": 1
  }
}
```

---

## 🔧 Troubleshooting

### ❌ MailHog ไม่เปิด (localhost:8025)

**สาเหตุ:** Container ไม่ได้รัน

**แก้ไข:**
```bash
# เช็คว่า container รันหรือเปล่า
docker ps | grep mailhog

# ถ้าไม่มี ให้รันใหม่
docker-compose up -d mailhog

# เช็ค logs
docker logs su-booking-mailhog
```

---

### ❌ ไม่มีอีเมลเข้า MailHog

**สาเหตุ 1:** SMTP config ผิด

**เช็ค .env:**
```bash
cat backend/.env | grep SMTP
```

**ต้องเป็น:**
```
SMTP_HOST=localhost
SMTP_PORT=1025
```

**สาเหตุ 2:** Email service ไม่ได้เปิด

**เช็ค logs ตอน start server:**
```
✅ Email service initialized  ← ต้องมี
🚀 Started 3 email workers    ← ต้องมี
```

**สาเหตุ 3:** SMTP_ENABLED=false

**แก้ไข:**
```env
SMTP_ENABLED=true  ← ต้องเป็น true
```

---

## 🎯 ข้อดีของ MailHog vs Gmail

| Feature | MailHog | Gmail |
|---------|---------|-------|
| ตั้งค่า | ✅ ง่าย (ไม่ต้องตั้งค่า) | ❌ ยาก (ต้อง App Password) |
| ค่าใช้จ่าย | ✅ ฟรี | ✅ ฟรี (แต่มี limit) |
| Rate Limiting | ✅ ไม่มี | ❌ มี (500 emails/day) |
| ดูอีเมล | ✅ Web UI สวย | ⚠️ ต้อง login Gmail |
| ทดสอบ Template | ✅ ง่ายมาก | ⚠️ ต้องส่งจริง |
| Security | ✅ ไม่มีข้อมูลจริงรั่ว | ⚠️ ต้องระวังข้อมูล |
| Production | ❌ ใช้ไม่ได้ | ✅ ใช้ได้ |

**คำแนะนำ:**
- 🧪 **Development:** ใช้ MailHog
- 🚀 **Production:** ใช้ Gmail/SendGrid/AWS SES

---

## 🔄 เปลี่ยนจาก MailHog → Gmail

เมื่อต้องการส่งอีเมลจริงใน Production:

```bash
nano backend/.env
```

**แก้ไข:**
```env
# === Gmail (Production) ===
SMTP_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Restart server:**
```bash
make dev
```

✅ ตอนนี้จะส่งอีเมลจริงๆ แล้ว!

---

## 📋 Checklist สำหรับทดสอบ

- [ ] ✅ MailHog รันแล้ว (docker ps)
- [ ] ✅ เปิด Web UI ได้ (localhost:8025)
- [ ] ✅ .env ตั้งค่าถูกต้อง (SMTP_PORT=1025)
- [ ] ✅ Backend รันแล้ว (make dev)
- [ ] ✅ เห็น logs "Email sent successfully"
- [ ] ✅ เปิด MailHog เห็นอีเมล
- [ ] ✅ คลิกดูอีเมลใน HTML tab สวยงาม

---

## 🎉 สรุป

### วิธีใช้งาน MailHog (3 ขั้นตอน):

```bash
# 1. เริ่ม MailHog
docker-compose up -d

# 2. ตั้งค่า .env
SMTP_HOST=localhost
SMTP_PORT=1025

# 3. รัน server + ทดสอบ
make dev
curl -X POST .../bookings  # สร้างการจอง

# 4. ดูอีเมลที่ http://localhost:8025
```

**ผลลัพธ์:**
- ✅ อีเมลแสดงใน MailHog UI
- ✅ ไม่ส่งอีเมลจริง
- ✅ ทดสอบได้ไม่จำกัด
- ✅ ดู HTML template สวยงาม

---

**🐶 Happy Testing with MailHog!**
