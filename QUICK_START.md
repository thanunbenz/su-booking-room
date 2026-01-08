# 🚀 Quick Start Guide - SU Booking Room

เริ่มต้นใช้งานโปรเจคใน 5 นาที!

---

## ✅ ก่อนเริ่ม - เช็คว่ามีพร้อมหรือยัง

```bash
# เช็ค Docker
docker --version
# ควรได้: Docker version 20.x.x หรือสูงกว่า

# เช็ค Docker Compose
docker-compose --version
# ควรได้: Docker Compose version 2.x.x หรือสูงกว่า

# เช็ค Make
make --version
# ควรได้: GNU Make 3.x หรือสูงกว่า
```

### ยังไม่มี? ติดตั้งก่อน:
- **Docker Desktop**: https://www.docker.com/products/docker-desktop
- **Make**: macOS มีอยู่แล้ว, Windows ใช้ chocolatey: `choco install make`

---

## 🎯 วิธีที่ 1: ใช้ Docker (แนะนำ - ง่ายสุด!)

### ขั้นตอน:

```bash
# 1. Clone project
git clone <repository-url>
cd su-booking-room

# 2. เปิด Docker Desktop ให้พร้อม (icon เขียว)

# 3. Start ทุกอย่างด้วยคำสั่งเดียว!
make up

# 4. รอ 1-2 นาที... (ครั้งแรกจะนานหน่อย)

# 5. เช็คสถานะ
make status
```

### เปิดเบราว์เซอร์:
- 🌐 **Frontend**: http://localhost:3000
- 🚀 **Backend**: http://localhost:8000/health
- 🗄️ **Database**: localhost:5432

### เสร็จแล้ว! 🎉

---

## 🛠️ วิธีที่ 2: Development Mode (ไม่ใช้ Docker)

### ข้อกำหนด:
- Go 1.25+
- Node.js 20+
- PostgreSQL 16

### ขั้นตอน:

```bash
# 1. Clone project
git clone <repository-url>
cd su-booking-room

# 2. ติดตั้ง dependencies
make install

# 3. Start PostgreSQL (ถ้ายังไม่มี ใช้ Docker)
docker-compose up -d postgres

# 4. Start Backend (Terminal 1)
make dev-backend

# 5. Start Frontend (Terminal 2 - เปิดใหม่)
make dev-frontend

# 6. เปิดเบราว์เซอร์ http://localhost:3000
```

---

## 📋 คำสั่งที่ใช้บ่อย

```bash
# Start
make up                 # เริ่ม services ทั้งหมด

# Stop
make down               # หยุด services

# Logs
make logs               # ดู logs ทั้งหมด
make logs-backend       # ดูแค่ backend
make logs-frontend      # ดูแค่ frontend

# Status
make status             # เช็คสถานะ

# Restart
make restart            # Restart ทุก services
make rebuild            # Rebuild และ restart

# Database
make db-shell           # เข้า PostgreSQL
make db-reset           # Reset database (ลบข้อมูลทั้งหมด!)

# Help
make help               # ดูคำสั่งทั้งหมด
```

---

## 🎓 ตัวอย่างการใช้งาน

### เริ่มทำงานทุกวัน:
```bash
cd su-booking-room
make up
# รอจน status เป็น "Up" ทั้งหมด
make status
# เปิด http://localhost:3000
```

### เลิกงาน:
```bash
make down
```

### แก้โค้ดแล้วต้องการเห็นผล:
```bash
make rebuild
```

### Debug ปัญหา:
```bash
make logs
# หรือ
make logs-backend
```

---

## ❓ แก้ปัญหา

### Docker ไม่ทำงาน?
1. เปิด Docker Desktop
2. รอจนกว่า icon จะเป็นสีเขียว
3. `make up` ใหม่

### Port ถูกใช้งาน?
```bash
# หา process ที่ใช้ port
lsof -i:3000
lsof -i:8000

# Kill process
kill -9 <PID>
```

### ข้อมูล database พัง?
```bash
make db-reset
# พิมพ์ y เพื่อยืนยัน
```

### อื่นๆ ไม่ work?
```bash
# ทำความสะอาดทุกอย่าง
make clean
make build
make up
```

---

## 📚 เอกสารเพิ่มเติม

- **คู่มือละเอียด**: อ่าน [MAKEFILE_GUIDE.md](MAKEFILE_GUIDE.md)
- **Project README**: อ่าน [README.md](README.md)
- **ดูคำสั่งทั้งหมด**: `make help`

---

## 🎯 Next Steps

หลังจาก start สำเร็จแล้ว:

1. ✅ ทดสอบ Backend: http://localhost:8000/health
2. ✅ เปิด Frontend: http://localhost:3000
3. ✅ ลองเข้า Database: `make db-shell`
4. ✅ ดู logs: `make logs`
5. ✅ เริ่มพัฒนา! 🚀

---

**Happy Coding! 💻**

มีปัญหา? อ่าน [MAKEFILE_GUIDE.md](MAKEFILE_GUIDE.md) หรือสร้าง issue บน GitHub
