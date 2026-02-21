# SU Booking Room

ระบบจองห้องเรียน/ห้องประชุม สำหรับภาควิชาคอมพิวเตอร์ มหาวิทยาลัยศิลปากร

---

## Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Go 1.25+, Fiber v2, GORM v1.31 |
| Database | PostgreSQL 16 (Alpine) |
| DevOps | Docker, Docker Compose, Makefile |

---

## Quick Start

### ด้วย Docker (แนะนำ)

```bash
# 1. Clone repository
git clone <repository-url>
cd su-booking-room

# 2. สร้าง .env จาก template
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Start database
make up

# 4. รัน backend + frontend พร้อมกัน
make dev
```

**URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/v1
- Database: localhost:5432

### บัญชีทดสอบ

| Email | Role | Password |
|-------|------|----------|
| admin@silpakorn.edu | Admin | password123 |
| teacher1@silpakorn.edu | Teacher | password123 |
| visitor@silpakorn.edu | Visitor | password123 |

รัน seed data: `POST http://localhost:8000/api/v1/seed/all` (ต้อง login ด้วย admin ก่อน)

---

## Make Commands

```bash
make help              # แสดงคำสั่งทั้งหมด

# Development
make up                # Start database (Docker)
make dev               # รัน backend + frontend พร้อมกัน
make dev-backend       # รัน backend อย่างเดียว (port 8000)
make dev-frontend      # รัน frontend อย่างเดียว (port 3000)

# Docker
make build             # Build Docker images
make rebuild           # Rebuild & restart
make down              # Stop services
make logs              # Show logs
make status            # Check service status

# Database
make db-shell          # เปิด PostgreSQL shell
make db-reset          # รีเซ็ต database
```

---

## Project Structure

```
su-booking-room/
├── backend/
│   ├── internal/
│   │   ├── config/        # Database config
│   │   ├── handlers/      # HTTP handlers (MVC controllers)
│   │   ├── models/        # GORM models
│   │   ├── routes/        # Route definitions
│   │   ├── middleware/    # JWT auth, RBAC, logging
│   │   ├── utils/         # JWT, password, validator, response helpers
│   │   └── seed/          # Database seeder
│   ├── migrations/        # SQL migration files
│   ├── main.go
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   │   ├── admin/     # Admin pages (buildings, rooms, users, bookings, schedules)
│   │   │   ├── booking/   # Booking flow
│   │   │   ├── room/      # Room detail
│   │   │   ├── building/  # Building detail
│   │   │   ├── my-bookings/
│   │   │   ├── profile/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # AuthContext, ThemeContext
│   │   └── lib/           # API client, withAuth HOC, withRole HOC
│   ├── package.json
│   └── Dockerfile
│
├── docs/                  # Documentation (แบ่งหมวดหมู่)
│   ├── guides/            # คู่มือการใช้งาน
│   ├── api/               # เอกสาร API และการทดสอบ
│   ├── database/          # SQL queries, seed data
│   ├── docker/            # Docker guides
│   ├── architecture/      # สถาปัตยกรรมระบบ
│   └── planning/          # แผนการพัฒนา, สถานะโครงการ
│
├── docker-compose.yml
├── Makefile
└── CLAUDE.md              # คำแนะนำสำหรับ Claude Code
```

---

## API Endpoints

Base URL: `http://localhost:8000/api/v1`

| กลุ่ม | Endpoint | Method | Auth |
|-------|----------|--------|------|
| Auth | `/auth/login` | POST | Public |
| Auth | `/auth/register` | POST | Public |
| Auth | `/auth/me` | GET | JWT |
| Buildings | `/buildings` | GET | Public |
| Buildings | `/buildings` | POST/PUT/DELETE | Admin |
| Rooms | `/rooms` | GET | Public |
| Rooms | `/rooms/:id/availability` | GET | Public |
| Rooms | `/rooms` | POST/PUT/DELETE | Admin |
| Bookings | `/bookings/my` | GET | JWT |
| Bookings | `/bookings` | POST | JWT |
| Bookings | `/bookings` | GET | Admin |
| Bookings | `/bookings/:id/status` | PATCH | Admin |
| Users | `/users` | GET/POST/PUT/DELETE | Admin |
| Roles | `/roles` | GET | JWT |
| Schedules | `/schedules` | GET/POST/PUT/DELETE | Admin |
| Seed | `/seed/all` | POST | Admin |
| Seed | `/seed/clear` | DELETE | Admin |
| Health | `/health` | GET | Public |

---

## Roles & Permissions

| Role | สิทธิ์ |
|------|-------|
| Admin | เข้าถึงทุกอย่าง + จัดการ users, buildings, rooms, schedules, อนุมัติ/ปฏิเสธการจอง |
| Teacher | จองห้อง, ดูการจองของตัวเอง, ยกเลิกการจองของตัวเอง |
| Visitor | ดูตารางการใช้ห้องอย่างเดียว (read-only) |

---

## Environment Variables

### Backend (`backend/.env`)

```env
SERVER_PORT=8000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=su_booking_room
JWT_SECRET=your-secret-key
CORS_ORIGINS=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## Documentation

ดูเอกสารทั้งหมดได้ที่ [docs/README.md](docs/README.md)

### ลิงก์ที่ใช้บ่อย

- [Quick Start Guide](docs/guides/QUICK_START.md) — เริ่มต้นใช้งานใน 5 นาที
- [Architecture](docs/architecture/ARCHITECTURE.md) — สถาปัตยกรรมระบบ
- [API Testing Quick Reference](docs/api/API_TESTING_QUICKREF.md) — ทดสอบ API ฉบับย่อ
- [Seed API Guide](docs/api/SEED_API_GUIDE.md) — สร้าง mock data
- [Project Status](docs/planning/PROJECT_STATUS.md) — สถานะโครงการและ TODO
