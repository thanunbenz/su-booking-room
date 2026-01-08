# 📘 คู่มือการใช้งาน Makefile - SU Booking Room

คู่มือนี้จะอธิบายการใช้งานคำสั่ง `make` ทั้งหมดในโปรเจค SU Booking Room

---

## 📋 สารบัญ

1. [คำสั่งพื้นฐาน](#คำสั่งพื้นฐาน)
2. [Docker Commands](#docker-commands)
3. [Development Commands](#development-commands)
4. [Database Commands](#database-commands)
5. [Build Commands](#build-commands)
6. [Testing Commands](#testing-commands)
7. [Cleanup Commands](#cleanup-commands)
8. [ตัวอย่างการใช้งานจริง](#ตัวอย่างการใช้งานจริง)
9. [Troubleshooting](#troubleshooting)

---

## คำสั่งพื้นฐาน

### `make help`
แสดงรายการคำสั่งทั้งหมดพร้อมคำอธิบาย

```bash
make help
```

**ผลลัพธ์:**
```
SU Booking Room - Available Commands:

  help            Show this help message
  up              Start all services with Docker Compose
  down            Stop all services
  ...
```

**ใช้เมื่อไร:** ต้องการดูคำสั่งที่มีให้ใช้งาน หรือลืมคำสั่ง

---

## Docker Commands

### `make up`
🚀 **Start ทุก services** (PostgreSQL, Backend, Frontend)

```bash
make up
```

**สิ่งที่เกิดขึ้น:**
1. สร้าง Docker containers ทั้งหมด
2. Start PostgreSQL database
3. Start Backend (Go + Fiber) รอ DB พร้อม
4. Start Frontend (Next.js)
5. Run Auto Migration สร้างตารางอัตโนมัติ

**URLs หลัง start สำเร็จ:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Database: localhost:5432

**เวลาที่ใช้:** ประมาณ 1-2 นาทีในครั้งแรก

**ใช้เมื่อไร:** ทุกครั้งที่ต้องการรันโปรเจคด้วย Docker

---

### `make down`
⏹️ **Stop ทุก services**

```bash
make down
```

**สิ่งที่เกิดขึ้น:**
1. หยุด containers ทั้งหมด
2. ลบ containers (แต่ไม่ลบข้อมูลใน database)

**ใช้เมื่อไร:** เลิกทำงานแล้วต้องการปิด services

**⚠️ หมายเหตุ:** ข้อมูลใน database ยังคงอยู่ (เก็บใน Docker volume)

---

### `make build`
🔨 **Build Docker images ใหม่ทั้งหมด**

```bash
make build
```

**สิ่งที่เกิดขึ้น:**
1. Build Backend Docker image
2. Build Frontend Docker image
3. ใช้ `--no-cache` เพื่อ build สดใหม่

**เวลาที่ใช้:** 3-5 นาที

**ใช้เมื่อไร:**
- เปลี่ยน Dockerfile
- ติดตั้ง dependencies ใหม่
- ต้องการ build สดใหม่ทั้งหมด

---

### `make rebuild`
🔄 **Stop, Rebuild, และ Start ใหม่ทั้งหมด**

```bash
make rebuild
```

**สิ่งที่เกิดขึ้น:**
1. `make down` - หยุด services
2. `make build` - build images ใหม่
3. `make up` - start services

**ใช้เมื่อไร:**
- แก้โค้ด backend/frontend แล้วต้องการเห็นผล
- เปลี่ยน dependencies
- มีปัญหาแปลกๆ ต้องการ rebuild สดใหม่

**⏱️ เวลาที่ใช้:** 3-6 นาที

---

### `make restart`
♻️ **Restart ทุก services** (ไม่ rebuild)

```bash
make restart
```

**สิ่งที่เกิดขึ้น:**
1. Restart containers ที่มีอยู่
2. ไม่ build ใหม่

**ใช้เมื่อไร:**
- แก้ไขไฟล์ config เล็กน้อย
- ต้องการ restart เร็วๆ

**⏱️ เวลาที่ใช้:** 10-20 วินาที

---

### `make logs`
📜 **ดู logs ทุก services แบบ real-time**

```bash
make logs
```

**สิ่งที่เกิดขึ้น:**
- แสดง logs จาก PostgreSQL, Backend, Frontend
- กด `Ctrl+C` เพื่อออก

**ใช้เมื่อไร:**
- Debug ปัญหา
- ต้องการดู logs ทั้งหมด
- เช็คว่า services รันปกติหรือไม่

---

### `make logs-backend`
📜 **ดู Backend logs เท่านั้น**

```bash
make logs-backend
```

**ตัวอย่าง output:**
```
Successfully connected to database with GORM!
Auto migration completed
Server starting on port 8000
```

**ใช้เมื่อไร:** Debug backend, ดู API requests

---

### `make logs-frontend`
📜 **ดู Frontend logs เท่านั้น**

```bash
make logs-frontend
```

**ใช้เมื่อไร:** Debug frontend, ดู build errors

---

### `make logs-db`
📜 **ดู Database logs เท่านั้น**

```bash
make logs-db
```

**ใช้เมื่อไร:** ดู SQL queries, connection issues

---

### `make status` หรือ `make ps`
📊 **แสดงสถานะทุก services**

```bash
make status
# หรือ
make ps
```

**ตัวอย่าง output:**
```
NAME                    STATUS      PORTS
su-booking-postgres     Up          0.0.0.0:5432->5432/tcp
su-booking-backend      Up          0.0.0.0:8000->8000/tcp
su-booking-frontend     Up          0.0.0.0:3000->3000/tcp
```

**ใช้เมื่อไร:** ต้องการเช็คว่า services รันอยู่หรือไม่

---

## Development Commands

### `make dev-backend`
🔧 **รัน Backend แบบ development (ไม่ใช้ Docker)**

```bash
make dev-backend
```

**สิ่งที่เกิดขึ้น:**
1. ใช้ `go run main.go`
2. รันบน localhost:8000
3. Hot reload เมื่อแก้โค้ด

**ข้อกำหนด:**
- ติดตั้ง Go 1.25.4+
- PostgreSQL รันอยู่ (localhost:5432)

**ใช้เมื่อไร:**
- พัฒนา backend
- ต้องการ debug แบบละเอียด
- ไม่ต้องการใช้ Docker

---

### `make dev-frontend`
🎨 **รัน Frontend แบบ development (ไม่ใช้ Docker)**

```bash
make dev-frontend
```

**สิ่งที่เกิดขึ้น:**
1. ใช้ `npm run dev`
2. รันบน localhost:3000
3. Hot reload เมื่อแก้โค้ด

**ข้อกำหนด:**
- ติดตั้ง Node.js 20+
- Backend รันอยู่ (localhost:8000)

**ใช้เมื่อไร:**
- พัฒนา frontend
- แก้ UI/UX
- ไม่ต้องการใช้ Docker

---

## Database Commands

### `make db-shell`
💻 **เข้า PostgreSQL shell**

```bash
make db-shell
```

**สิ่งที่เกิดขึ้น:**
- เปิด `psql` client
- เชื่อมต่อกับ database: `su_booking_room`

**ตัวอย่างคำสั่งใน shell:**
```sql
-- ดูตารางทั้งหมด
\dt

-- ดูข้อมูลในตาราง users
SELECT * FROM users;

-- ดูจำนวนการจอง
SELECT COUNT(*) FROM bookings;

-- ออกจาก shell
\q
```

**ใช้เมื่อไร:**
- ต้องการ query ข้อมูล
- Debug database
- ดูโครงสร้างตาราง

---

### `make db-reset`
⚠️ **Reset database (ลบข้อมูลทั้งหมด!)**

```bash
make db-reset
```

**สิ่งที่เกิดขึ้น:**
1. ถามยืนยัน (พิมพ์ `y` เพื่อดำเนินการ)
2. Stop และลบ database volume
3. Start database ใหม่
4. ข้อมูลทั้งหมดหายไป
5. Auto migration สร้างตารางใหม่

**⚠️ คำเตือน:** ข้อมูลทั้งหมดจะถูกลบและกู้คืนไม่ได้!

**ใช้เมื่อไร:**
- เริ่มต้นใหม่
- เปลี่ยน schema มาก
- มีปัญหากับ database
- ต้องการข้อมูลสะอาด

**ตัวอย่าง:**
```bash
$ make db-reset
⚠️  WARNING: This will delete all data!
Are you sure? [y/N] y
Database reset complete!
```

---

## Build Commands

### `make build-backend`
🔨 **Build backend binary**

```bash
make build-backend
```

**สิ่งที่เกิดขึ้น:**
1. Build Go binary
2. บันทึกที่ `backend/bin/server`

**ไฟล์ที่ได้:** `backend/bin/server`

**วิธีรัน binary:**
```bash
./backend/bin/server
```

**ใช้เมื่อไร:**
- ต้องการ production binary
- Deploy แบบไม่ใช้ Docker
- ทดสอบ performance

---

### `make build-frontend`
🎨 **Build frontend**

```bash
make build-frontend
```

**สิ่งที่เกิดขึ้น:**
1. รัน `npm run build`
2. สร้าง optimized production build
3. บันทึกใน `frontend/.next`

**ใช้เมื่อไร:**
- ต้องการ production build
- ทดสอบ production mode

---

## Testing Commands

### `make test-backend`
🧪 **รัน backend tests**

```bash
make test-backend
```

**สิ่งที่เกิดขึ้น:**
1. รัน `go test -v ./...`
2. แสดงผลการ test

**ใช้เมื่อไร:**
- ก่อน commit code
- หลังแก้ logic
- ตรวจสอบว่าโค้ดไม่พัง

---

## Cleanup Commands

### `make clean`
🧹 **ลบ Docker resources**

```bash
make clean
```

**สิ่งที่เกิดขึ้น:**
1. Stop และลบ containers
2. ลบ volumes (ข้อมูล database จะหายไป!)
3. ทำความสะอาด Docker system

**ใช้เมื่อไร:**
- ต้องการพื้นที่ disk
- เริ่มต้นใหม่หมด
- มีปัญหาแปลกๆ กับ Docker

---

### `make clean-all`
🗑️ **ลบทุกอย่างรวม Docker images**

```bash
make clean-all
```

**สิ่งที่เกิดขึ้น:**
1. Stop และลบ containers
2. ลบ volumes
3. ลบ Docker images
4. ลบ system cache

**⚠️ คำเตือน:**
- ข้อมูลทั้งหมดจะหายไป!
- จะต้อง rebuild images ใหม่
- ใช้เวลานาน

**ใช้เมื่อไร:**
- ต้องการพื้นที่ disk มาก
- Docker มีปัญหาหนัก
- เริ่มต้นทุกอย่างใหม่

---

## Installation Commands

### `make install`
📦 **ติดตั้ง dependencies ทั้งหมด**

```bash
make install
```

**สิ่งที่เกิดขึ้น:**
1. รัน `go mod download` (backend)
2. รัน `npm install` (frontend)

**ใช้เมื่อไร:**
- Clone project ครั้งแรก
- เปลี่ยน dependencies

---

### `make install-backend`
📦 **ติดตั้ง backend dependencies**

```bash
make install-backend
```

**ใช้เมื่อไร:** เพิ่ม Go packages ใหม่

---

### `make install-frontend`
📦 **ติดตั้ง frontend dependencies**

```bash
make install-frontend
```

**ใช้เมื่อไร:** เพิ่ม npm packages ใหม่

---

## ตัวอย่างการใช้งานจริง

### 🎯 Scenario 1: เริ่มทำงานครั้งแรก

```bash
# 1. Clone project
git clone <repository-url>
cd su-booking-room

# 2. Start ทุกอย่างด้วย Docker
make up

# 3. รอ 1-2 นาที แล้วเช็คสถานะ
make status

# 4. เปิดเบราว์เซอร์
# Frontend: http://localhost:3000
# Backend: http://localhost:8000/health
```

---

### 🎯 Scenario 2: พัฒนา Backend

```bash
# 1. Start แค่ database
docker-compose up -d postgres

# 2. รัน backend แบบ dev
make dev-backend

# 3. ทดสอบ API
curl http://localhost:8000/health

# 4. ดู logs real-time (แสดงอยู่แล้วในหน้าจอ)

# 5. เสร็จแล้ว กด Ctrl+C
```

---

### 🎯 Scenario 3: แก้ไข Frontend

```bash
# 1. Start backend + database ด้วย Docker
docker-compose up -d postgres backend

# 2. รัน frontend แบบ dev
make dev-frontend

# 3. เปิดเบราว์เซอร์ http://localhost:3000
# 4. แก้ code จะ hot reload อัตโนมัติ

# 5. เสร็จแล้ว กด Ctrl+C
```

---

### 🎯 Scenario 4: Debug ปัญหา

```bash
# 1. ดู logs ทั้งหมด
make logs

# 2. หรือดูแยก service
make logs-backend
make logs-frontend
make logs-db

# 3. เช็คสถานะ
make status

# 4. เข้าดู database
make db-shell
\dt  # ดูตาราง
SELECT * FROM users LIMIT 10;
\q

# 5. ถ้ายังไม่ได้ ลอง restart
make restart

# 6. ถ้ายังไม่ได้ rebuild
make rebuild
```

---

### 🎯 Scenario 5: เปลี่ยน Database Schema

```bash
# 1. แก้ไขไฟล์ models (เช่น backend/internal/models/user.go)

# 2. Reset database เพื่อ migrate ใหม่
make db-reset
# พิมพ์ y เพื่อยืนยัน

# 3. Rebuild backend
make rebuild

# 4. ตรวจสอบตาราง
make db-shell
\d users  # ดู schema ของ users
\q
```

---

### 🎯 Scenario 6: เสร็จแล้วจะปิดเครื่อง

```bash
# หยุด services ทั้งหมด
make down

# ข้อมูลใน database จะยังอยู่
# ครั้งหน้าใช้ make up ได้เลย
```

---

### 🎯 Scenario 7: ทำความสะอาดทุกอย่าง

```bash
# ลบทุกอย่างยกเว้น images
make clean

# หรือลบทั้งหมดรวม images (ประหยัดพื้นที่)
make clean-all
# พิมพ์ y เพื่อยืนยัน

# ครั้งหน้าจะต้อง make build ใหม่
```

---

### 🎯 Scenario 8: Production Deployment

```bash
# 1. Build images
make build

# 2. ทดสอบรัน
make up

# 3. Test ให้แน่ใจ
curl http://localhost:8000/health

# 4. Export images สำหรับ deploy
docker save su-booking-backend:latest | gzip > backend.tar.gz
docker save su-booking-frontend:latest | gzip > frontend.tar.gz
```

---

## Troubleshooting

### ❌ Problem: `make up` ไม่ work

**อาการ:**
```bash
$ make up
ERROR: Cannot connect to Docker daemon
```

**วิธีแก้:**
1. เปิด Docker Desktop
2. รอให้ Docker พร้อม (icon เขียว)
3. ลองใหม่

---

### ❌ Problem: Port ถูกใช้งานอยู่

**อาการ:**
```bash
Error: Bind for 0.0.0.0:3000 failed: port is already allocated
```

**วิธีแก้:**

**Option 1: หยุดโปรแกรมที่ใช้ port นั้น**
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# หรือหา process
lsof -i:3000
```

**Option 2: เปลี่ยน port ใน docker-compose.yml**
```yaml
frontend:
  ports:
    - "3001:3000"  # เปลี่ยนจาก 3000:3000
```

---

### ❌ Problem: Database connection failed

**อาการ:**
```bash
Failed to connect to database: connection refused
```

**วิธีแก้:**
```bash
# 1. เช็คว่า postgres รันอยู่
make status

# 2. ดู logs
make logs-db

# 3. ลอง restart
make restart

# 4. ถ้ายังไม่ได้ rebuild
make rebuild
```

---

### ❌ Problem: Frontend build error

**อาการ:**
```bash
Error: Cannot find module 'next'
```

**วิธีแก้:**
```bash
# 1. Rebuild image ใหม่
make build

# 2. หรือติดตั้ง dependencies ใหม่
cd frontend
npm install
cd ..
make rebuild
```

---

### ❌ Problem: Out of disk space

**อาการ:**
```bash
Error: No space left on device
```

**วิธีแก้:**
```bash
# ทำความสะอาด Docker
make clean

# หรือลบทั้งหมด
make clean-all

# ลบ unused images ทั้งหมด
docker system prune -af --volumes
```

---

### ❌ Problem: Changes ไม่มีผล

**วิธีแก้:**
```bash
# 1. ลอง rebuild
make rebuild

# 2. หรือ build จากศูนย์
make clean
make build
make up
```

---

## 💡 Tips & Tricks

### 1. ดู logs แบบสวยงาม
```bash
# ดู 100 บรรทัดล่าสุด
make logs | tail -100

# Grep หา error
make logs-backend | grep -i error

# บันทึก logs เป็นไฟล์
make logs > logs.txt
```

### 2. รัน command ใน container
```bash
# เข้า backend shell
docker-compose exec backend sh

# เข้า frontend shell
docker-compose exec frontend sh

# รัน Go command
docker-compose exec backend go version
```

### 3. ดู resource usage
```bash
# ดูการใช้ CPU, Memory
docker stats
```

### 4. Quick restart backend
```bash
docker-compose restart backend
make logs-backend
```

### 5. Copy ไฟล์จาก container
```bash
docker cp su-booking-backend:/root/main ./backend-binary
```

---

## 📚 อ้างอิง

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GNU Make Manual](https://www.gnu.org/software/make/manual/)
- [Go Documentation](https://go.dev/doc/)
- [Next.js Documentation](https://nextjs.org/docs)

---

## 🆘 ต้องการความช่วยเหลือ?

1. ดูคำสั่งทั้งหมด: `make help`
2. ดู README.md
3. ดู logs: `make logs`
4. สร้าง issue บน GitHub

---

**เอกสารนี้อัพเดทล่าสุด:** 2026-01-08
**Version:** 1.0.0
