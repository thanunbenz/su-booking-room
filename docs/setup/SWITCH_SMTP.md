# 🔄 วิธีสลับระหว่าง MailHog และ Gmail SMTP

**1 ไฟล์เดียว:** `backend/.env`

---

## 🐶 Option 1: MailHog (Development)

**ใช้เมื่อ:** ทดสอบ, พัฒนา ✅ **แนะนำ**

### ขั้นตอน:

```bash
# 1. เปิด .env
cd backend
nano .env

# 2. แก้ไขบรรทัดเหล่านี้:
SMTP_ENABLED=true
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USERNAME=
SMTP_PASSWORD=

# 3. Save & Exit (Ctrl+O, Enter, Ctrl+X)

# 4. Start MailHog
docker-compose up -d mailhog

# 5. Restart Backend
make dev
```

**เปิดดูอีเมล:**
- 🌐 http://localhost:8025

---

## 📧 Option 2: Gmail (Production)

**ใช้เมื่อ:** ต้องการส่งอีเมลจริง

### ขั้นตอน:

```bash
# 1. เปิด .env
cd backend
nano .env

# 2. แก้ไขบรรทัดเหล่านี้:
SMTP_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password     # ← ต้องใช้ App Password

# 3. Save & Exit (Ctrl+O, Enter, Ctrl+X)

# 4. Restart Backend
make dev
```

**เช็คอีเมล:**
- 📬 Gmail Inbox

---

## 🎯 เปรียบเทียบ

| Feature | MailHog | Gmail |
|---------|---------|-------|
| ตั้งค่า | ✅ ง่าย (1 นาที) | ⚠️ ยาก (ต้อง App Password) |
| ส่งอีเมลจริง | ❌ ไม่ส่ง | ✅ ส่งจริง |
| ดูอีเมล | ✅ Web UI (localhost:8025) | Gmail Inbox |
| ทดสอบ Template | ✅ ง่ายมาก | ⚠️ ต้องส่งจริง |
| Rate Limiting | ✅ ไม่มี | ⚠️ 500/day |
| **แนะนำสำหรับ** | **Development** ⭐ | **Production** |

---

## 🚀 Quick Switch Commands

### → MailHog

```bash
cd backend
cp .env.mailhog .env  # Copy config
docker-compose up -d mailhog
make dev
```

### → Gmail

```bash
cd backend
cp .env.gmail .env    # Copy config (แล้วแก้ email/password)
make dev
```

---

## ✅ ตรวจสอบว่าใช้อะไรอยู่

```bash
# ดู config ปัจจุบัน
cd backend
cat .env | grep SMTP_HOST

# Output:
# SMTP_HOST=localhost          ← MailHog
# หรือ
# SMTP_HOST=smtp.gmail.com     ← Gmail
```

---

## 🔧 Troubleshooting

### ❌ เปลี่ยนแล้วยังไม่เปลี่ยน?

**ต้อง Restart Backend!**

```bash
# Stop backend (Ctrl+C)
# Start again
make dev
```

**เช็ค logs ว่าเปลี่ยนแล้ว:**
```
✅ SMTP Config loaded: localhost:1025        ← MailHog
หรือ
✅ SMTP Config loaded: smtp.gmail.com:587    ← Gmail
```

---

## 📋 Template Files

สร้างไฟล์ template ไว้ใช้งาน:

```bash
# MailHog template
backend/.env.mailhog    ← Copy ไปใช้

# Gmail template
backend/.env.gmail      ← Copy แล้วแก้ email/password
```

**วิธีใช้:**
```bash
cd backend

# Switch to MailHog
cp .env.mailhog .env
make dev

# Switch to Gmail
cp .env.gmail .env
nano .env  # แก้ email/password
make dev
```

---

## 🎉 สรุป

**สลับ SMTP = แก้ 1 ไฟล์ + Restart**

```
backend/.env
   ↓
แก้ SMTP_HOST & SMTP_PORT
   ↓
make dev
   ↓
✅ Done!
```

**Default:** MailHog (ไม่ต้องตั้งค่าอะไร)
