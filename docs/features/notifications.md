# 📧 Notification System Documentation

**SU Booking Room** - Email Notification System with SMTP

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Setup](#setup)
5. [API Reference](#api-reference)
6. [Email Templates](#email-templates)
7. [Testing](#testing)
8. [Security](#security)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

ระบบแจ้งเตือนอัตโนมัติที่ส่งอีเมลเมื่อมีเหตุการณ์สำคัญเกี่ยวกับการจอง

### Notification Types

| Type | Trigger | Recipient | Description |
|------|---------|-----------|-------------|
| `booking_created` | สร้างการจองใหม่ | ผู้จอง | ยืนยันการจอง |
| `booking_approved` | Admin อนุมัติ | ผู้จอง | แจ้งการอนุมัติ |
| `booking_rejected` | Admin ปฏิเสธ | ผู้จอง | แจ้งการปฏิเสธ + เหตุผล |
| `booking_cancelled` | ยกเลิกการจอง | ผู้จอง | แจ้งการยกเลิก |
| `booking_reminder` | 24 ชม.ก่อนถึงเวลา | ผู้จอง | แจ้งเตือนล่วงหน้า |

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────┐
│                  Main Application               │
└────────────┬────────────────────────────────────┘
             │
             ├──► NotificationService
             │    ├─ Create notification record
             │    ├─ Prepare email data
             │    └─ Send to EmailService
             │
             ├──► EmailService
             │    ├─ SMTP connection
             │    ├─ Email queue (100)
             │    ├─ Worker pool (3)
             │    ├─ Template rendering
             │    └─ Retry mechanism (3x)
             │
             └──► ReminderService
                  ├─ Cron job (@hourly)
                  └─ Auto-send reminders
```

### File Structure

```
backend/
├── internal/
│   ├── config/
│   │   └── smtp.go                    # SMTP configuration
│   ├── services/
│   │   ├── email_service.go           # Email sending logic
│   │   ├── notification_service.go    # Notification business logic
│   │   └── reminder_service.go        # Cron jobs
│   ├── handlers/
│   │   ├── notification_handler.go    # API handlers
│   │   └── booking_handler.go         # Modified to send notifications
│   ├── middleware/
│   │   └── rate_limiter.go            # Rate limiting
│   ├── models/
│   │   └── notification.go            # Database model
│   └── templates/
│       └── email/
│           ├── base.html              # Base template
│           ├── booking_created.html
│           ├── booking_approved.html
│           ├── booking_rejected.html
│           ├── booking_cancelled.html
│           └── booking_reminder.html
```

---

## ✨ Features

### 1. Async Email Sending

อีเมลถูกส่งแบบ asynchronous ผ่าน queue:

```go
go notificationService.NotifyBookingCreated(bookingID)
// ↓
EmailJob → Queue (100) → Worker Pool (3) → SMTP
```

**ข้อดี:**
- ✅ ไม่ block HTTP response
- ✅ ส่งพร้อมกัน 3 emails
- ✅ Retry อัตโนมัติ (3 ครั้ง)

---

### 2. Rate Limiting

จำกัดการสร้างการจองเพื่อป้องกัน email bombing:

```go
middleware.InitRateLimiter(10, 1*time.Hour)
// → Max 10 bookings/hour/user
```

**Response (429 Too Many Requests):**
```json
{
  "success": false,
  "message": "Rate limit exceeded. Maximum 10 bookings per 1h0m0s"
}
```

---

### 3. Template System

HTML templates พร้อม dynamic data:

```html
<!-- Template -->
<h2>สวัสดีคุณ {{.UserName}}</h2>
<p>การจองห้อง {{.RoomName}} สำเร็จ</p>

<!-- Data -->
{
  "UserName": "Admin User",
  "RoomName": "CS Lab 1",
  "BookingDate": "15 March 2026",
  ...
}
```

---

### 4. Retry Mechanism

ส่งไม่สำเร็จ → retry อัตโนมัติ:

```
Attempt 1: ❌ Failed (network error)
Wait 5s...
Attempt 2: ❌ Failed (timeout)
Wait 5s...
Attempt 3: ✅ Success!
```

---

### 5. Cron Jobs

Reminder ส่งอัตโนมัติทุก 1 ชั่วโมง:

```go
@hourly → Check bookings in next 24h → Send reminders
```

---

## 🚀 Setup

### Prerequisites

- Go 1.25+
- PostgreSQL 16
- Docker (สำหรับ MailHog)

---

### Installation

#### 1. Install Dependencies

```bash
cd backend
go get gopkg.in/gomail.v2
go get github.com/robfig/cron/v3
```

---

#### 2. Setup MailHog (Development)

```bash
# Start MailHog
docker-compose up -d mailhog

# Verify
docker ps | grep mailhog
```

**Ports:**
- SMTP: `localhost:1025`
- Web UI: `http://localhost:8025`

---

#### 3. Configure Environment

```bash
cp .env.example .env
nano .env
```

**MailHog (Development):**
```env
SMTP_ENABLED=true
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM=SU Booking Room <noreply@silpakorn.edu>

EMAIL_QUEUE_SIZE=100
EMAIL_WORKER_COUNT=3
EMAIL_RETRY_COUNT=3
EMAIL_RETRY_DELAY=5s

REMINDER_ENABLED=true
REMINDER_HOURS_BEFORE=24

APP_BASE_URL=http://localhost:3000
```

**Gmail (Production):**
```env
SMTP_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

---

#### 4. Start Server

```bash
make dev
# หรือ
go run main.go
```

**Logs ที่ควรเห็น:**
```
✅ SMTP Config loaded: localhost:1025 (Workers: 3, Queue: 100)
✅ Email service initialized with 3 workers
🚀 Started 3 email workers
⏰ Reminder service started (checking every hour for bookings 24 hours ahead)
✅ Email, Notification, and Reminder services initialized
```

---

## 📡 API Reference

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication
```
Authorization: Bearer <JWT_TOKEN>
```

---

### Endpoints

#### 1. Get My Notifications

```http
GET /notifications/my?unread_only=true&limit=50
```

**Query Parameters:**
- `unread_only` (boolean): ดูเฉพาะที่ยังไม่ได้อ่าน (default: false)
- `limit` (integer): จำนวนสูงสุด (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "notification_id": 1,
        "user_id": 1,
        "booking_id": 1,
        "type": "booking_created",
        "message": "การจองห้อง CS Lab 1 ในวันที่ 15/03/2026 เวลา 09:00-12:00 ได้รับการบันทึกเรียบร้อยแล้ว (อนุมัติแล้ว)",
        "is_read": false,
        "email_sent": true,
        "email_sent_at": "2026-03-10T14:30:00Z",
        "email_error": null,
        "created_at": "2026-03-10T14:30:00Z"
      }
    ],
    "total": 1,
    "unread_count": 1
  }
}
```

---

#### 2. Mark as Read

```http
PATCH /notifications/:id/read
```

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Notification marked as read"
}
```

---

#### 3. Mark All as Read

```http
PATCH /notifications/read-all
```

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "All notifications marked as read"
}
```

---

#### 4. Delete Notification

```http
DELETE /notifications/:id
```

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Notification deleted successfully"
}
```

---

## 📧 Email Templates

### Template Variables

```go
data := map[string]interface{}{
    "UserName":          "Admin User",
    "BookingID":         1,
    "RoomName":          "CS Lab 1",
    "BuildingName":      "IT Building",
    "Title":             "Meeting",
    "BookingDate":       "15 March 2026",
    "StartTime":         "09:00",
    "EndTime":           "12:00",
    "Status":            "approved",
    "StatusText":        "อนุมัติแล้ว",
    "StatusNote":        "",
    "ViewBookingURL":    "http://localhost:3000/my-bookings",
    "BookNewURL":        "http://localhost:3000/booking",
    "CancelBookingURL":  "http://localhost:3000/my-bookings",
}
```

---

### Template Structure

```html
{{template "base" .}}

{{define "content"}}
  <h2>{{.Title}}</h2>
  <p>สวัสดีคุณ {{.UserName}}</p>

  <div class="info-box">
    <h3>รายละเอียด</h3>
    <p>ห้อง: {{.RoomName}}</p>
    <p>วันที่: {{.BookingDate}}</p>
  </div>

  <a href="{{.ViewBookingURL}}" class="button">ดูรายละเอียด</a>
{{end}}
```

---

### Customize Templates

แก้ไขไฟล์ใน `backend/internal/templates/email/`:

```bash
nano backend/internal/templates/email/booking_created.html
```

**เพิ่มข้อมูลใหม่:**

1. แก้ `notification_service.go`:
```go
data := map[string]interface{}{
    // ... existing ...
    "PhoneNumber": booking.User.PhoneNumber,  // เพิ่มใหม่
}
```

2. แก้ template:
```html
<p>เบอร์โทร: {{.PhoneNumber}}</p>
```

---

## 🧪 Testing

### 1. MailHog (Recommended)

```bash
# Start MailHog
docker-compose up -d mailhog

# Open Web UI
open http://localhost:8025

# Create booking → Check MailHog
curl -X POST http://localhost:8000/api/v1/bookings ...
```

---

### 2. cURL Testing

**Test Scripts:**
- [`test_notification_api.sh`](../backend/test_notification_api.sh) - API testing
- [`test_rate_limit.sh`](../backend/test_rate_limit.sh) - Rate limiting

```bash
cd backend
./test_notification_api.sh YOUR_JWT_TOKEN
```

---

### 3. Postman

Import collection: [`postman_collection.json`](../backend/postman_collection.json)

---

## 🔒 Security

### Rate Limiting

```go
// Max 10 bookings/hour per user
middleware.InitRateLimiter(10, 1*time.Hour)
```

**Implementation:** [`rate_limiter.go`](../backend/internal/middleware/rate_limiter.go)

---

### Queue Protection

```go
EMAIL_QUEUE_SIZE=100      # จำกัด 100 emails ใน queue
EMAIL_WORKER_COUNT=3      # จำกัด 3 concurrent connections
EMAIL_RETRY_COUNT=3       # Retry สูงสุด 3 ครั้ง
```

---

### Input Validation

- ✅ Email validation
- ✅ GORM parameterized queries (ป้องกัน SQL injection)
- ✅ Template escaping (ป้องกัน XSS)

---

## 🔧 Troubleshooting

### ❌ Email ไม่ส่ง

**1. เช็ค SMTP Config:**
```bash
cat backend/.env | grep SMTP
```

**2. เช็ค Logs:**
```bash
# ต้องเห็น:
✅ Worker #1: Email sent successfully
```

**3. เช็ค MailHog:**
```bash
docker logs su-booking-mailhog
```

---

### ❌ Queue Full

**Error:**
```
email queue is full, timeout after 5s
```

**แก้ไข:**
```env
EMAIL_QUEUE_SIZE=200  # เพิ่มจาก 100
```

---

### ❌ SMTP Connection Failed

**Error:**
```
SMTP send failed: dial tcp: connection refused
```

**แก้ไข:**
- ✅ เช็คว่า MailHog รันหรือยัง: `docker ps`
- ✅ เช็ค port: `SMTP_PORT=1025`
- ✅ Restart MailHog: `docker-compose restart mailhog`

---

## 📊 Monitoring

### Email Service Stats

```go
emailService.GetQueueStatus()
```

**Response:**
```json
{
  "queue_size": 5,
  "queue_capacity": 100,
  "workers": 3,
  "enabled": true
}
```

---

### Notification Stats

```sql
-- จำนวน notifications ที่ส่งสำเร็จ
SELECT type, COUNT(*)
FROM notifications
WHERE email_sent = true
GROUP BY type;
```

---

## 📚 Related Documentation

- [MailHog Guide](../MAILHOG_GUIDE.md) - วิธีใช้ MailHog
- [Email Testing Guide](../backend/TEST_EMAIL_GUIDE.md) - ทดสอบด้วย Gmail
- [Security TODO](../SECURITY_TODO.md) - Security enhancements
- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference

---

## 🎯 Summary

**Features:**
- ✅ 5 notification types
- ✅ HTML email templates
- ✅ Async sending (queue + workers)
- ✅ Rate limiting
- ✅ Retry mechanism
- ✅ Cron jobs (reminders)
- ✅ MailHog integration

**Status:**
- ✅ Fully implemented
- ✅ Tested
- ✅ Production-ready

---

**Last Updated:** 2026-03-10
