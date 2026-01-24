# SU Booking Room

ระบบจองห้องเรียน/ห้องประชุม สำหรับภาควิชาคอมพิวเตอร์ มหาวิทยาลัยศิลปากร

## 📚 เอกสาร

### 📖 Guides
- 🚀 **[Quick Start Guide](docs/guides/QUICK_START.md)** - เริ่มต้นใช้งานภายใน 5 นาที
- 📘 **[Makefile Guide](docs/guides/MAKEFILE_GUIDE.md)** - คู่มือการใช้งาน Make commands ทั้งหมด
- 📋 **[Makefile Cheatsheet](docs/guides/MAKEFILE_CHEATSHEET.md)** - คำสั่ง Make ฉบับย่อ

### 🧪 API Testing
- 📝 **[Booking API Test Guide](docs/api/BOOKING_API_TEST.md)** - คู่มือทดสอบ Booking API ด้วย Postman
- 📦 **[Postman Collection](docs/api/SU_Booking_Room_Postman_Collection.json)** - Import เข้า Postman ได้เลย
- 🔧 **[Test Script](docs/api/test_booking_api.sh)** - Bash script ทดสอบอัตโนมัติ

### 🏗️ Architecture & Planning
- 🏛️ **[Architecture](docs/architecture/ARCHITECTURE.md)** - สถาปัตยกรรมระบบ
- 📝 **[Backend Plan](docs/planning/BACKEND_PLAN.md)** - แผนการพัฒนา Backend

## 🏗️ Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS, TypeScript
- **Backend**: Go 1.25, Fiber v2, GORM
- **Database**: PostgreSQL 16
- **DevOps**: Docker, Docker Compose

## 👥 User Roles & Permissions

### 🔧 แอดมิน (Admin)
- **จัดการข้อมูลพื้นฐาน**
  - สร้าง/ลบ/แก้ไข ข้อมูลตึกเรียน
  - สร้าง/ลบ/แก้ไข ข้อมูลห้องเรียน
  - จัดการตารางเรียนประจำ (ใส่มือ ไม่มีดึงจาก reg)

- **การจองและจัดการ**
  - จองห้องแทนอาจารย์หรือบุคคลภายนอก
  - จองให้ภาควิชาอื่นได้ (แทนที่ภาคอื่นจะใช้ระบบเอง)
  - ยกเลิกการจองได้ พร้อมระบบแจ้งเตือนผู้จอง
  - รองรับการจองหลายวัน (ทั้งแบบติดกัน และไม่ติดกัน)
  - รองรับการขออุปกรณ์เสริม (โน้ตบุ๊ก ฯลฯ) โดยมีช่อง "อื่น ๆ"

- **การดูข้อมูลและรายงาน**
  - ดูสถานะการจองย้อนหลังและอนาคตทั้งหมด
  - ดูตารางการใช้ห้อง
  - เลือกได้ว่าจะปริ้นหรือไม่ปริ้นใบจอง

### 👨‍🏫 อาจารย์ (Teacher)
- **การจองห้อง**
  - จองห้องได้ โดยระบบป้องกันการจองซ้ำกับคนอื่น
  - เลือกวันเดียวหรือจองหลายวันได้
  - ระบุอุปกรณ์ที่ต้องการ

- **การดูข้อมูล**
  - ดูตารางห้องที่ตัวเองจอง
  - ดูตารางการใช้ห้อง

### 👀 ผู้เยี่ยมชม (Visitor)
- ดูตารางการใช้ห้อง (read-only)

## 📋 Features

### ✅ ระบบจัดการข้อมูลพื้นฐาน
- จัดการอาคาร (Buildings)
- จัดการห้อง (Rooms)
- จัดการตารางเรียนประจำ (Fixed Schedule)

### ✅ ระบบจองห้อง
- จองวันเดียวหรือหลายวัน (ทั้งแบบติดกัน และไม่ติดกัน)
- ป้องกันการจองซ้ำ
- ระบุอุปกรณ์เสริม (โน้ตบุ๊ก ฯลฯ) พร้อมช่อง "อื่น ๆ"
- ปริ้นใบจอง (Optional)

### ✅ ระบบแจ้งเตือน
- แจ้งเตือนเมื่อมีการยกเลิกการจอง

### ✅ ระบบจัดการผู้ใช้
- บทบาทผู้ใช้ 3 ระดับ (Admin, Teacher, Visitor)
- ระบบสิทธิ์การใช้งานตามบทบาท

## 🚀 Quick Start

### ด้วย Docker (แนะนำ)

```bash
# 1. Clone repository
git clone <repository-url>
cd su-booking-room

# 2. Start all services
make up

# 3. ตรวจสอบสถานะ
make status
```

**URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Database: localhost:5432

### การพัฒนาแบบ Local

```bash
# Install dependencies
make install

# Run backend
make dev-backend

# Run frontend (terminal ใหม่)
make dev-frontend
```

## 📦 Available Make Commands

```bash
make help              # แสดงคำสั่งทั้งหมด

# Docker Commands
make up                # Start all services
make down              # Stop all services
make build             # Build Docker images
make rebuild           # Rebuild และ restart
make restart           # Restart services
make logs              # Show all logs
make logs-backend      # Show backend logs
make logs-frontend     # Show frontend logs
make logs-db           # Show database logs

# Development Commands
make dev-backend       # Run backend locally
make dev-frontend      # Run frontend locally

# Database Commands
make db-shell          # เข้า PostgreSQL shell
make db-reset          # Reset database (ลบข้อมูลทั้งหมด!)

# Build Commands
make build-backend     # Build backend binary
make build-frontend    # Build frontend

# Testing
make test-backend      # Run backend tests

# Others
make status            # แสดงสถานะ services
make clean             # ลบ Docker resources
make install           # Install dependencies
```

## 🗄️ Database Schema

### Tables
- **roles** - บทบาทผู้ใช้ (admin, teacher, visitor)
- **users** - ข้อมูลผู้ใช้
- **buildings** - อาคาร
- **rooms** - ห้อง
- **bookings** - การจองห้อง
- **fixed_schedules** - ตารางเรียนประจำ
- **notifications** - การแจ้งเตือน

## 📁 Project Structure

```
su-booking-room/
├── backend/
│   ├── internal/
│   │   ├── config/          # Database config
│   │   ├── handlers/        # HTTP handlers (แบบง่าย - MVC style)
│   │   │   ├── auth_handler.go
│   │   │   ├── building_handler.go
│   │   │   ├── room_handler.go
│   │   │   └── health_handler.go
│   │   ├── models/          # Database models (GORM)
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth & Role middlewares
│   │   ├── utils/           # JWT, Password, Validator, Response
│   │   └── seed/            # Database seeder
│   ├── Dockerfile
│   └── main.go
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js app directory
│   │   └── components/     # React components
│   ├── Dockerfile
│   └── package.json
├── docs/                    # Documentation
│   ├── guides/
│   ├── planning/
│   └── architecture/
├── docker-compose.yml
├── Makefile
└── README.md
```

## 🔧 Environment Variables

สร้างไฟล์ `.env` จาก `.env.example`:

```bash
cp .env.example .env
```

แก้ไขค่าตามต้องการ:
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `NEXT_PUBLIC_API_URL` - Backend API URL

## 🛠️ Development

### Backend (Go)

```bash
cd backend

# Install dependencies
go mod download

# Run
go run main.go

# Build
go build -o bin/server main.go

# Test
go test -v ./...
```

### Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build
npm run build

# Start production
npm start
```

## 📝 API Documentation

Backend API รันที่ `http://localhost:8000`

### ทดสอบ API ด้วย Postman
```bash
# Import ไฟล์เหล่านี้เข้า Postman
1. docs/api/SU_Booking_Room_Postman_Collection.json  # Collection
2. docs/api/SU_Booking_Room_Postman_Environment.json  # Environment

# หรือใช้ Bash script ทดสอบอัตโนมัติ
chmod +x docs/api/test_booking_api.sh
./docs/api/test_booking_api.sh
```

### Main Endpoints

**Authentication**
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Register
- `GET /api/v1/auth/me` - Get current user

**Buildings**
- `GET /api/v1/buildings` - Get all buildings
- `GET /api/v1/buildings/:id` - Get building by ID
- `POST /api/v1/buildings` - Create building (Admin only)
- `PUT /api/v1/buildings/:id` - Update building (Admin only)
- `DELETE /api/v1/buildings/:id` - Delete building (Admin only)

**Rooms**
- `GET /api/v1/rooms` - Get all rooms
- `GET /api/v1/rooms/:id` - Get room by ID
- `GET /api/v1/rooms/:id/availability` - Get room availability
- `POST /api/v1/rooms` - Create room (Admin only)

**Bookings**
- `GET /api/v1/bookings/my` - Get my bookings
- `GET /api/v1/bookings` - Get all bookings (Admin only)
- `POST /api/v1/bookings` - Create booking
- `PATCH /api/v1/bookings/:id/status` - Update booking status (Admin only)
- `DELETE /api/v1/bookings/:id/cancel` - Cancel booking

📖 **รายละเอียดเพิ่มเติม:** [Booking API Test Guide](docs/api/BOOKING_API_TEST.md)

## 🤝 Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Authors

- **Sumbenz** - *Initial work*

## 🙏 Acknowledgments

- Silpakorn University
- Go Fiber Framework
- Next.js Team
