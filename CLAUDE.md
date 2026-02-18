# CLAUDE.md — SU Booking Room

คำแนะนำสำหรับ Claude Code ในการทำงานกับ project นี้

---

## ภาพรวมโปรเจกต์

**SU Booking Room** — ระบบจองห้องเรียน/ห้องประชุมสำหรับภาควิชาคอมพิวเตอร์ มหาวิทยาลัยศิลปากร

| ส่วน | เทคโนโลยี |
|------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Go 1.25+, Fiber v2, GORM v1.31 |
| Database | PostgreSQL 16 (Alpine) |
| DevOps | Docker, Docker Compose, Makefile |

---

## โครงสร้างโปรเจกต์

```
su-booking-room/
├── backend/
│   ├── internal/
│   │   ├── config/        # Database configuration
│   │   ├── handlers/      # HTTP handlers (controllers)
│   │   ├── models/        # GORM database models
│   │   ├── routes/        # Route definitions
│   │   ├── middleware/    # Auth, RBAC, logging, error
│   │   ├── utils/         # JWT, password, validators, response helpers
│   │   └── seed/          # Database seed data
│   ├── migrations/
│   ├── main.go
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   │   ├── admin/     # Admin pages (buildings, rooms, users, bookings, schedules)
│   │   │   ├── booking/   # Booking flow pages
│   │   │   ├── room/      # Room detail pages
│   │   │   ├── building/  # Building detail pages
│   │   │   ├── my-bookings/
│   │   │   ├── profile/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── components/
│   │   │   ├── layout/    # Header, Sidebar, MainLayout
│   │   │   ├── auth/      # Auth components, DarkMode toggle
│   │   │   └── admin/     # Admin form modals
│   │   ├── contexts/      # ThemeContext, AuthContext
│   │   └── lib/           # API client, withAuth HOC, withRole HOC
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
│
├── docs/                  # Documentation (API, architecture, guides)
├── docker-compose.yml     # PostgreSQL service
├── Makefile               # Dev/build commands
└── PROJECT_STATUS.md      # Status & TODO list
```

---

## คำสั่งพัฒนา

### เริ่มต้นพัฒนา

```bash
# เริ่ม database
make up

# รัน backend + frontend พร้อมกัน
make dev

# รันแยกกัน
make dev-backend      # Go backend (hot reload via Air) — port 8000
make dev-frontend     # Next.js frontend (hot reload) — port 3000
```

### Docker

```bash
make build            # Build Docker images
make rebuild          # Rebuild & restart
make down             # Stop services
make logs             # Show logs
make clean            # Clean Docker resources
make status           # Check service status
```

### Database

```bash
make db-shell         # เปิด PostgreSQL shell
make db-reset         # รีเซ็ต database
```

### Frontend (npm)

```bash
npm run dev           # Development server
npm run build         # Production build
npm run lint          # ESLint
```

### Backend (Go)

```bash
go run main.go        # Run server
go build -o bin/server ./...
go test ./...         # Run tests
```

---

## API

**Base URL:** `http://localhost:8000/api/v1`

**Authentication:** JWT token ใน header `Authorization: Bearer <token>`

### Endpoints หลัก

| กลุ่ม | Endpoint | Method | Auth |
|-------|----------|--------|------|
| Auth | `/auth/login` | POST | Public |
| Auth | `/auth/register` | POST | Public |
| Auth | `/auth/me` | GET | JWT |
| Buildings | `/buildings` | GET | Public |
| Buildings | `/buildings` | POST/PUT/DELETE | Admin |
| Rooms | `/rooms` | GET | Public |
| Rooms | `/rooms` | POST/PUT/DELETE | Admin |
| Bookings | `/bookings/my` | GET | JWT |
| Bookings | `/bookings` | POST | JWT |
| Bookings | `/bookings` | GET | Admin |
| Bookings | `/bookings/:id/status` | PATCH | Admin |
| Users | `/users` | GET/POST/PUT/DELETE | Admin |
| Roles | `/roles` | GET | JWT |
| Schedules | `/schedules` | GET/POST | Admin |
| Health | `/health` | GET | Public |

---

## สถาปัตยกรรม Backend

รูปแบบ **MVC** สำหรับ Go backend:

- **Models** (`internal/models/`) — GORM structs สำหรับ tables ทั้งหมด
- **Handlers** (`internal/handlers/`) — ประมวลผล HTTP request/response
- **Routes** (`internal/routes/`) — กำหนด URL paths และ middleware
- **Middleware** (`internal/middleware/`) — JWT auth, role checks, logging

ลำดับ request: `Router → Middleware → Handler → Model → DB`

### Models หลัก

| Model | ตาราง | ความสัมพันธ์ |
|-------|-------|-------------|
| `Role` | roles | หนึ่ง Role มีหลาย User |
| `User` | users | มี FK → role_id |
| `Building` | buildings | หนึ่ง Building มีหลาย Room |
| `Room` | rooms | มี FK → building_id |
| `Booking` | bookings | มี FK → user_id, room_id |
| `FixedSchedule` | fixed_schedules | มี FK → room_id |

---

## สถาปัตยกรรม Frontend

รูปแบบ **Next.js App Router**:

- **`app/`** — Pages (Server & Client Components)
- **`components/`** — Reusable UI components
- **`contexts/`** — Global state (Auth, Theme)
- **`lib/`** — API client, HOCs (withAuth, withRole)

### Patterns สำคัญ

- ใช้ `withAuth(Component)` HOC สำหรับ protected pages
- ใช้ `withRole(Component, ['Admin'])` HOC สำหรับ role-based access
- API calls ทั้งหมดผ่าน `lib/api.ts` (centralized API client)
- Dark mode ผ่าน `ThemeContext`

---

## บัญชีทดสอบ (Seed Data)

| Email | Role | Password |
|-------|------|----------|
| admin@silpakorn.edu | Admin | password123 |
| teacher1@silpakorn.edu | Teacher | password123 |
| visitor@silpakorn.edu | Visitor | password123 |

รัน seed: `POST http://localhost:8000/api/v1/seed`

---

## Roles & Permissions

| Role | สิทธิ์ |
|------|-------|
| Admin | เข้าถึงทุกอย่าง + จัดการ users, buildings, rooms, schedules |
| Teacher | จองห้อง, ดูห้อง, จัดการการจองของตัวเอง |
| Visitor | จองห้อง, ดูห้อง, จัดการการจองของตัวเอง (สิทธิ์เท่า Teacher) |

---

## สถานะโปรเจกต์

- **Backend:** 100% เสร็จสมบูรณ์
- **Frontend:** ~90% เสร็จสมบูรณ์

### TODO ที่เหลือ

- [ ] Multi-day booking support
- [ ] Notification system
- [ ] Print booking form (PDF generation)
- [ ] Calendar view for bookings
- [ ] Admin booking on behalf of others

ดูรายละเอียดเพิ่มเติมใน [PROJECT_STATUS.md](PROJECT_STATUS.md)

---

## Environment Variables

### Backend (`.env`)

```env
SERVER_PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=su_booking_room
JWT_SECRET=your-secret-key
CORS_ORIGINS=http://localhost:3000
```

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_ENV=development
```

---

## Convention การเขียนโค้ด

### Go (Backend)

- ใช้ `snake_case` สำหรับ JSON fields ใน structs
- Handler functions: `VerbResource` เช่น `GetRoom`, `CreateBooking`
- Return errors ผ่าน `utils.ErrorResponse(c, status, message)`
- Return success ผ่าน `utils.SuccessResponse(c, data, message)`

### TypeScript (Frontend)

- ใช้ `camelCase` สำหรับ variables และ functions
- Components: `PascalCase`
- Types/Interfaces: ประกาศใน file เดียวกันหรือ `types/` directory
- ใช้ `async/await` แทน `.then()` chains
