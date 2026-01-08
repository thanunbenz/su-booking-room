# SU Booking Room

ระบบจองห้องเรียน/ห้องประชุม สำหรับมหาวิทยาลัยศิลปากร

## 📚 เอกสาร

- 🚀 **[Quick Start Guide](QUICK_START.md)** - เริ่มต้นใช้งานภายใน 5 นาที
- 📘 **[Makefile Guide](MAKEFILE_GUIDE.md)** - คู่มือการใช้งาน Make commands ทั้งหมด

## 🏗️ Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS, TypeScript
- **Backend**: Go 1.25, Fiber v2, GORM
- **Database**: PostgreSQL 16
- **DevOps**: Docker, Docker Compose

## 📋 Features

- ✅ ระบบจัดการอาคารและห้อง
- ✅ ระบบจองห้อง
- ✅ ตารางเรียนประจำ (Fixed Schedule)
- ✅ ระบบแจ้งเตือน
- ✅ จัดการผู้ใช้และสิทธิ์ (Admin, Teacher, Visitor)

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
│   │   ├── handlers/        # HTTP handlers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── middleware/      # Middlewares
│   ├── Dockerfile
│   └── main.go
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js app directory
│   │   └── components/     # React components
│   ├── Dockerfile
│   └── package.json
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

### Endpoints (Coming soon)
- `GET /health` - Health check
- `GET /api/v1/buildings` - Get all buildings
- `GET /api/v1/rooms` - Get all rooms
- `POST /api/v1/bookings` - Create booking
- ...

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
