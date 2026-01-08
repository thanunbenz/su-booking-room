# 🏗️ Architecture - SU Booking Room

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User / Browser                           │
│                      http://localhost:3000                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js 16)                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ - React 19 + TypeScript                                    │ │
│  │ - TailwindCSS                                              │ │
│  │ - Dark Mode Support                                        │ │
│  │ - Server Components                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                      Port: 3000                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ REST API
                             │ http://localhost:8000/api
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Go + Fiber v2)                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ HTTP Layer (Fiber)                                         │ │
│  │  ├── Routes (internal/routes)                              │ │
│  │  ├── Handlers (internal/handlers)                          │ │
│  │  └── Middleware (CORS, Logger)                             │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Business Logic                                             │ │
│  │  └── Services (internal/services)                          │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Data Layer                                                 │ │
│  │  ├── Models (internal/models) - GORM                       │ │
│  │  ├── Repositories (internal/repositories)                  │ │
│  │  └── Database Config (internal/config)                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                      Port: 8000                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ SQL (GORM)
                             │ postgresql://localhost:5432
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Database (PostgreSQL 16)                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Tables:                                                    │ │
│  │  ├── roles                                                 │ │
│  │  ├── users                                                 │ │
│  │  ├── buildings                                             │ │
│  │  ├── rooms                                                 │ │
│  │  ├── bookings                                              │ │
│  │  ├── fixed_schedules                                       │ │
│  │  └── notifications                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                      Port: 5432                                  │
│                   Volume: postgres_data                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Docker Compose Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      Docker Network                              │
│                   (su-booking-network)                           │
│                                                                  │
│  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────┐ │
│  │   Frontend        │  │    Backend        │  │  PostgreSQL │ │
│  │   Container       │  │    Container      │  │  Container  │ │
│  │                   │  │                   │  │             │ │
│  │ Next.js App       │  │ Go Binary         │  │ postgres:16 │ │
│  │ Node 20 Alpine    │  │ Alpine Linux      │  │   Alpine    │ │
│  │                   │  │                   │  │             │ │
│  │ Port: 3000        │◀─┤ Port: 8000        │◀─┤ Port: 5432  │ │
│  │                   │  │                   │  │             │ │
│  │ Depends on:       │  │ Depends on:       │  │ Healthcheck │ │
│  │  - Backend        │  │  - PostgreSQL     │  │   Enabled   │ │
│  └───────────────────┘  └───────────────────┘  └─────────────┘ │
│         │                       │                      │        │
│         │                       │                      │        │
│         ▼                       ▼                      ▼        │
│   Port: 3000:3000         Port: 8000:8000       Port: 5432:5432│
└──────────────────────────────────────────────────────────────────┘
         │                       │                      │
         │                       │                      │
         └───────────────────────┴──────────────────────┘
                          Host Machine
                       (Your Computer)
```

---

## Project Structure

```
su-booking-room/
│
├── 📄 Docker & Config Files
│   ├── docker-compose.yml          # Orchestrate 3 services
│   ├── Makefile                    # Development commands
│   ├── .env.example                # Environment template
│   └── .gitignore                  # Git ignore rules
│
├── 📚 Documentation
│   ├── README.md                   # Project overview
│   ├── QUICK_START.md              # 5-minute guide
│   ├── MAKEFILE_GUIDE.md           # Complete guide
│   ├── MAKEFILE_CHEATSHEET.md      # Quick reference
│   └── ARCHITECTURE.md             # This file
│
├── 🔧 Backend (Go)
│   ├── Dockerfile                  # Multi-stage build
│   ├── .dockerignore
│   ├── go.mod / go.sum            # Dependencies
│   ├── main.go                    # Entry point
│   │
│   ├── internal/
│   │   ├── config/                # Database config
│   │   │   └── database.go
│   │   │
│   │   ├── models/                # GORM Models
│   │   │   ├── role.go
│   │   │   ├── users.go
│   │   │   ├── building.go
│   │   │   ├── room.go
│   │   │   ├── booking.go
│   │   │   ├── fixed_schedule.go
│   │   │   └── notification.go
│   │   │
│   │   ├── handlers/              # HTTP Handlers
│   │   │   └── health_handler.go
│   │   │
│   │   ├── routes/                # API Routes
│   │   │   └── routes.go
│   │   │
│   │   ├── services/              # Business Logic
│   │   ├── repositories/          # Data Access
│   │   ├── middleware/            # Middlewares
│   │   └── utils/                 # Utilities
│   │
│   └── cmd/                       # CLI commands
│
└── 🎨 Frontend (Next.js)
    ├── Dockerfile                 # Multi-stage build
    ├── .dockerignore
    ├── package.json               # Dependencies
    ├── next.config.ts             # Next.js config
    ├── tsconfig.json              # TypeScript config
    ├── tailwind.config.ts         # Tailwind config
    │
    ├── src/
    │   ├── app/                   # App Router
    │   │   ├── layout.tsx         # Root layout
    │   │   ├── page.tsx           # Home page
    │   │   └── ...                # Other pages
    │   │
    │   ├── components/            # React Components
    │   │   ├── layout/            # Layout components
    │   │   │   ├── Header.tsx
    │   │   │   ├── Sidebar.tsx
    │   │   │   └── MainLayout.tsx
    │   │   │
    │   │   └── ...                # Other components
    │   │
    │   └── contexts/              # React Contexts
    │       └── ThemeContext.tsx   # Dark mode
    │
    └── public/                    # Static files
```

---

## Data Flow

### 1. User Authentication Flow
```
User ──┐
       │ 1. Login Request
       ▼
    Frontend ──┐
               │ 2. POST /api/auth/login
               ▼
            Backend ──┐
                      │ 3. Validate credentials
                      │ 4. Query users table
                      ▼
                   Database
                      │
                      │ 5. Return user data
                      ▼
            Backend ──┘
               │ 6. Generate token
               │ 7. Return response
               ▼
    Frontend ──┘
       │ 8. Store token
       │ 9. Redirect to dashboard
       ▼
    User
```

### 2. Booking Creation Flow
```
User ──┐
       │ 1. Fill booking form
       ▼
    Frontend ──┐
               │ 2. POST /api/bookings
               │    (with auth token)
               ▼
            Backend ──┐
                      │ 3. Validate token
                      │ 4. Check room availability
                      │ 5. Create booking record
                      ▼
                   Database
                      │
                      │ 6. Insert to bookings table
                      │ 7. Create notification
                      ▼
            Backend ──┘
               │ 8. Return booking data
               ▼
    Frontend ──┘
       │ 9. Show success message
       ▼
    User
```

---

## Database Schema Relations

```
┌─────────────┐
│   roles     │
│─────────────│
│ role_id (PK)│
│ role_name   │
└─────────────┘
       │
       │ 1:N
       ▼
┌─────────────┐          ┌──────────────────┐
│   users     │          │  notifications   │
│─────────────│          │──────────────────│
│ user_id (PK)│◀────────┤│ notification_id  │
│ role_id (FK)│         │ user_id (FK)     │
│ email       │         │ booking_id (FK)  │
│ username    │         └──────────────────┘
└─────────────┘
       │
       │ 1:N
       ▼
┌─────────────┐          ┌─────────────┐
│  bookings   │          │ buildings   │
│─────────────│          │─────────────│
│ booking_id  │          │ building_id │
│ user_id (FK)│          └─────────────┘
│ room_id (FK)│                 │
│ start_time  │                 │ 1:N
│ end_time    │                 ▼
│ status      │          ┌─────────────┐
└─────────────┘          │   rooms     │
       │                 │─────────────│
       │ N:1             │ room_id (PK)│
       └────────────────▶│ building_id │◀─┐
                         │ capacity    │  │
                         └─────────────┘  │
                                │         │
                                │ 1:N     │
                                ▼         │
                         ┌────────────────┴┐
                         │ fixed_schedules  │
                         │──────────────────│
                         │ schedule_id (PK) │
                         │ room_id (FK)     │
                         │ day_of_week      │
                         │ start_time       │
                         │ end_time         │
                         └──────────────────┘
```

---

## Technology Stack Details

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19
- **Styling**: TailwindCSS 4
- **Icons**: React Icons
- **Build**: Webpack (via Next.js)
- **Deployment**: Standalone output for Docker

### Backend
- **Language**: Go 1.25.4
- **Web Framework**: Fiber v2
- **ORM**: GORM v1.31
- **Database Driver**: pgx v5
- **Middleware**: CORS, Logger
- **Build**: Multi-stage Docker build

### Database
- **DBMS**: PostgreSQL 16
- **Features**:
  - UUID support
  - Full-text search ready
  - JSON support
  - Triggers & Constraints
- **Backup**: Docker volume persistence

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Automation**: GNU Make
- **CI/CD**: (To be implemented)

---

## API Structure (Planned)

```
/api
├── /auth
│   ├── POST   /login
│   ├── POST   /register
│   └── POST   /logout
│
├── /users
│   ├── GET    /
│   ├── GET    /:id
│   ├── POST   /
│   ├── PUT    /:id
│   └── DELETE /:id
│
├── /buildings
│   ├── GET    /
│   ├── GET    /:id
│   ├── POST   /
│   ├── PUT    /:id
│   └── DELETE /:id
│
├── /rooms
│   ├── GET    /
│   ├── GET    /:id
│   ├── GET    /:id/availability
│   ├── POST   /
│   ├── PUT    /:id
│   └── DELETE /:id
│
├── /bookings
│   ├── GET    /
│   ├── GET    /:id
│   ├── POST   /
│   ├── PUT    /:id
│   ├── DELETE /:id
│   └── PATCH  /:id/status
│
├── /schedules
│   ├── GET    /
│   ├── GET    /room/:room_id
│   ├── POST   /
│   ├── PUT    /:id
│   └── DELETE /:id
│
└── /notifications
    ├── GET    /
    ├── GET    /:id
    └── PATCH  /:id/read
```

---

## Environment Variables

```bash
# Database
DB_HOST=localhost         # Database host
DB_PORT=5432             # Database port
DB_USER=sumbenz          # Database user
DB_PASSWORD=***          # Database password
DB_NAME=su_booking_room  # Database name

# Backend
PORT=8000                # Backend port

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development
```

---

## Security Considerations

1. **Authentication**: JWT tokens (to be implemented)
2. **Authorization**: Role-based access control (RBAC)
3. **Password**: Bcrypt hashing
4. **SQL Injection**: Prevented by GORM parameterized queries
5. **CORS**: Configured in backend
6. **Environment**: Sensitive data in .env (not committed)
7. **Docker**: Non-root users in containers
8. **Database**: Prepared statements via GORM

---

## Performance Optimizations

### Frontend
- Server-side rendering (SSR)
- Static generation where possible
- Code splitting
- Image optimization
- Standalone output (smaller Docker image)

### Backend
- Connection pooling (GORM)
- Prepared statements
- Efficient queries with indexes
- Lightweight Alpine images
- Multi-stage builds (smaller images)

### Database
- Proper indexing on foreign keys
- Composite indexes for common queries
- Connection pooling

---

## Development Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Clone Repository                                         │
│    git clone <repo>                                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Setup Environment                                        │
│    cp .env.example .env                                     │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Start Services                                           │
│    make up                                                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Development                                              │
│    - Edit code                                              │
│    - make rebuild (if needed)                               │
│    - make logs (for debugging)                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Testing                                                  │
│    make test-backend                                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Commit & Push                                            │
│    git add .                                                │
│    git commit -m "message"                                  │
│    git push                                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Strategy (Future)

```
Developer ──┐
            │ 1. Push to GitHub
            ▼
         GitHub ──┐
                  │ 2. Trigger CI/CD
                  ▼
              CI/CD ──┐
                      │ 3. Run tests
                      │ 4. Build images
                      │ 5. Push to registry
                      ▼
                 Registry ──┐
                            │ 6. Pull images
                            ▼
                       Production ──┐
                                    │ 7. Deploy
                                    │ 8. Health check
                                    ▼
                                  Users
```

---

**อัพเดทล่าสุด:** 2026-01-08
**Version:** 1.0.0
