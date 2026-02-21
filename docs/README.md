# Documentation

เอกสารประกอบสำหรับโปรเจค SU Booking Room

---

## โครงสร้างเอกสาร

```
docs/
├── README.md                  # ไฟล์นี้ — ภาพรวมเอกสารทั้งหมด
│
├── guides/                    # คู่มือการใช้งาน
│   ├── QUICK_START.md                 — เริ่มต้นใช้งานภายใน 5 นาที
│   ├── BACKEND_QUICKSTART.md          — เริ่มต้นพัฒนา Backend
│   ├── FRONTEND_QUICKSTART.md         — เริ่มต้นพัฒนา Frontend
│   ├── ROLE_MIDDLEWARE_GUIDE.md       — คู่มือใช้งาน Role Middleware
│   ├── CREATE_NEW_PROJECT.md          — คู่มือสร้างโปรเจคใหม่
│   ├── MAKEFILE_GUIDE.md              — คู่มือการใช้งาน Make commands
│   └── MAKEFILE_CHEATSHEET.md         — คำสั่ง Make ฉบับย่อ
│
├── api/                       # เอกสาร API และการทดสอบ
│   ├── README.md                              — ภาพรวมและ Quick Start
│   ├── TESTING_WORKFLOW.md                    — คู่มือเลือกวิธีทดสอบที่เหมาะสม
│   ├── API_TESTING_QUICKREF.md                — คู่มือทดสอบ API ฉบับย่อ
│   ├── API_TESTING.md                         — วิธีการทดสอบ API ทั่วไป
│   ├── BOOKING_API_TEST.md                    — คู่มือทดสอบ Booking API (Postman)
│   ├── FRONTEND_API_GUIDE.md                  — คู่มือใช้งาน API ฝั่ง Frontend
│   ├── SEED_API_GUIDE.md                      — คู่มือใช้งาน Seed API (สร้าง mock data)
│   ├── POSTMAN_EXAMPLES.md                    — ตัวอย่าง Postman requests
│   ├── SU_Booking_Room_Postman_Collection.json — Postman Collection (import ได้เลย)
│   ├── SU_Booking_Room_Postman_Environment.json — Postman Environment
│   └── test_booking_api.sh                    — Bash script ทดสอบอัตโนมัติ
│
├── database/                  # เอกสารฐานข้อมูล
│   ├── SQL_QUERIES.md                 — คำสั่ง SQL ที่ใช้บ่อย
│   ├── BOOKING_SEED_DATA.md           — SQL สำหรับสร้างข้อมูล Seed
│   └── MIGRATION_FIX.md               — แก้ไขปัญหา Migration
│
├── docker/                    # เอกสาร Docker
│   └── DOCKER_RESTART.md              — วิธีการ restart Docker services
│
├── architecture/              # สถาปัตยกรรมระบบ
│   ├── ARCHITECTURE.md                — สถาปัตยกรรมและโครงสร้างโปรเจค
│   ├── ARCHITECTURE_SIMPLE.md         — สถาปัตยกรรมแบบเข้าใจง่าย
│   └── REFACTOR_COMPARISON.md         — เปรียบเทียบก่อนและหลัง refactor
│
└── planning/                  # แผนการพัฒนา
    ├── BACKEND_PLAN.md                — แผนการพัฒนา Backend (8 Phases)
    └── PROJECT_STATUS.md              — สถานะโครงการและ TODO list
```

---

## เริ่มต้นใช้งาน

สำหรับผู้ใช้งานครั้งแรก แนะนำให้อ่านตามลำดับ:

1. **[Quick Start Guide](guides/QUICK_START.md)** — ติดตั้งและรันโปรเจคใน 5 นาที
2. **[Architecture](architecture/ARCHITECTURE.md)** — ทำความเข้าใจโครงสร้างระบบ
3. **[Makefile Guide](guides/MAKEFILE_GUIDE.md)** — คำสั่งที่ใช้บ่อยในการพัฒนา
4. **[Docker Guide](docker/DOCKER_RESTART.md)** — จัดการ Docker services

---

## สำหรับนักพัฒนา

### Backend Developer

1. **[Backend Quickstart](guides/BACKEND_QUICKSTART.md)** — เริ่มต้นพัฒนา Backend
2. **[Architecture](architecture/ARCHITECTURE.md)** — สถาปัตยกรรมระบบทั้งหมด
3. **[API Testing Quick Reference](api/API_TESTING_QUICKREF.md)** — คู่มือทดสอบ API ฉบับย่อ
4. **[Booking API Test Guide](api/BOOKING_API_TEST.md)** — คู่มือทดสอบ Booking API แบบเต็ม
5. **[Seed API Guide](api/SEED_API_GUIDE.md)** — คู่มือใช้งาน Seed API สร้าง mock data
6. **[Database Queries](database/SQL_QUERIES.md)** — คำสั่ง SQL ที่ใช้บ่อย
7. **[Booking Seed Data](database/BOOKING_SEED_DATA.md)** — SQL สำหรับสร้างข้อมูล seed
8. **[Backend Plan](planning/BACKEND_PLAN.md)** — แผนการพัฒนา Backend

### Frontend Developer

1. **[Frontend Quickstart](guides/FRONTEND_QUICKSTART.md)** — เริ่มต้นพัฒนา Frontend
2. **[Frontend API Guide](api/FRONTEND_API_GUIDE.md)** — คู่มือใช้งาน API
3. **[Architecture](architecture/ARCHITECTURE.md)** — ทำความเข้าใจโครงสร้างระบบ

---

## หมวดหมู่เอกสาร

| หมวดหมู่ | โฟลเดอร์ | เนื้อหา |
|----------|----------|---------|
| คู่มือการใช้งาน | `guides/` | Quick start, Quickstart สำหรับ Backend/Frontend, Makefile |
| API | `api/` | การทดสอบ API, Postman Collection, Bash script |
| ฐานข้อมูล | `database/` | SQL queries, Seed data, Migration fixes |
| Docker | `docker/` | การจัดการ containers |
| สถาปัตยกรรม | `architecture/` | โครงสร้างระบบ, design decisions |
| แผนการพัฒนา | `planning/` | Roadmap, สถานะโครงการ, TODO list |

---

## เอกสารที่เกี่ยวข้อง

- **[Root README](../README.md)** — ข้อมูลภาพรวมโปรเจค
- **[CLAUDE.md](../CLAUDE.md)** — คำแนะนำสำหรับ Claude Code
- **[Project Status](planning/PROJECT_STATUS.md)** — สถานะโครงการปัจจุบัน
