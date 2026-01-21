# 🐳 วิธี Restart Docker และแก้ปัญหา

## ปัญหาที่พบ
```
failed to connect to `user=sumbenz database=su_booking_room`:
hostname resolving error: lookup postgres on 127.0.0.11:53: no such host
```

## สาเหตุ
1. Backend container พยายามเชื่อมต่อไปที่ `localhost` แทนที่จะเป็น `postgres` service
2. ขาด `JWT_SECRET` environment variable

## ✅ แก้ไขแล้ว
- เพิ่ม `JWT_SECRET` ใน docker-compose.yml

---

## 🚀 วิธี Rebuild และ Restart

### Option 1: Rebuild ทั้งหมด (แนะนำ)
```bash
# Stop และลบ containers เก่า
docker-compose down

# Rebuild images ใหม่
docker-compose build --no-cache backend

# Start ใหม่
docker-compose up -d

# ดู logs
docker-compose logs -f backend
```

### Option 2: Restart เฉพาะ Backend
```bash
# Stop backend container
docker-compose stop backend

# Remove backend container
docker-compose rm -f backend

# Rebuild backend
docker-compose build --no-cache backend

# Start backend
docker-compose up -d backend

# ดู logs
docker-compose logs -f backend
```

### Option 3: Restart ทั้งหมดแบบง่าย
```bash
docker-compose down && docker-compose up -d
docker-compose logs -f backend
```

---

## 🔍 ตรวจสอบว่า Container ทำงาน

### 1. ดู containers ทั้งหมด
```bash
docker-compose ps
```

**ควรเห็น:**
```
NAME                    IMAGE                   STATUS
su-booking-postgres     postgres:16-alpine      Up (healthy)
su-booking-backend      su-booking-backend      Up
su-booking-frontend     su-booking-frontend     Up
```

### 2. ดู logs backend
```bash
docker-compose logs backend | tail -50
```

**ควรเห็น:**
```
Successfully connected to database with GORM!
🌱 Starting database seeding...
✓ Created role: admin
✓ Created role: teacher
✓ Created role: visitor
✓ Created admin user:
  Email: admin@silpakorn.edu
  Password: admin123
  Role: Admin
✅ Database seeding completed!

📋 Registered Routes:
==========================================
  GET    /api/v1/health
  POST   /api/v1/auth/login
  POST   /api/v1/auth/register
  GET    /api/v1/auth/me
==========================================

🚀 Server starting on port 8000
📡 API available at http://localhost:8000/api/v1
```

### 3. Test API
```bash
# Health check
curl http://localhost:8000/api/v1/health

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@silpakorn.edu",
    "password": "admin123"
  }'
```

---

## 🐛 Troubleshooting

### ปัญหา: Database connection failed
```bash
# เข้าไปใน backend container
docker exec -it su-booking-backend sh

# ลอง ping ไป postgres
ping postgres

# ถ้า ping ไม่ผ่าน = network problem
# ออกจาก container
exit

# ลบและสร้าง network ใหม่
docker-compose down
docker network prune
docker-compose up -d
```

### ปัญหา: Routes ไม่ทำงาน
```bash
# ดู logs ว่ามี routes ลงทะเบียนหรือไม่
docker-compose logs backend | grep "Registered Routes" -A 10

# ถ้าไม่เห็น = SetupRoutes ไม่ถูกเรียก
# ลอง rebuild
docker-compose build --no-cache backend
docker-compose up -d backend
```

### ปัญหา: Port already in use
```bash
# หา process ที่ใช้ port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# หรือเปลี่ยน port ใน docker-compose.yml
# ports:
#   - "8001:8000"  # เปลี่ยนจาก 8000:8000
```

---

## 📝 Environment Variables ที่ต้องมี

ใน `docker-compose.yml` backend service:
```yaml
environment:
  DB_HOST: postgres          # ชื่อ service (ไม่ใช่ localhost!)
  DB_PORT: 5432
  DB_USER: sumbenz
  DB_PASSWORD: sumbenz2806
  DB_NAME: su_booking_room
  JWT_SECRET: su-booking-room-jwt-secret-key-change-in-production
  PORT: 8000
  TZ: Asia/Bangkok
```

---

## ✅ เมื่อทุกอย่างทำงาน

จะเห็น:
1. ✅ Database เชื่อมต่อสำเร็จ
2. ✅ Seed data สำเร็จ (roles + admin user)
3. ✅ Routes ลงทะเบียนครบ 4 endpoints
4. ✅ Server start ที่ port 8000
5. ✅ API ทำงานได้

---

**Happy Dockerizing! 🐳**
