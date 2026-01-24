# 📚 Documentation

เอกสารประกอบสำหรับโปรเจค SU Booking Room

## 📁 โครงสร้างเอกสาร

```
docs/
├── guides/                # คู่มือการใช้งาน
│   ├── QUICK_START.md              - เริ่มต้นใช้งานภายใน 5 นาที
│   ├── BACKEND_QUICKSTART.md       - เริ่มต้นพัฒนา Backend
│   ├── FRONTEND_QUICKSTART.md      - เริ่มต้นพัฒนา Frontend
│   ├── ROLE_MIDDLEWARE_GUIDE.md    - คู่มือใช้งาน Role Middleware
│   ├── CREATE_NEW_PROJECT.md       - คู่มือสร้างโปรเจคใหม่
│   ├── MAKEFILE_GUIDE.md           - คู่มือการใช้งาน Make commands
│   └── MAKEFILE_CHEATSHEET.md      - คำสั่ง Make ฉบับย่อ
│
├── api/                   # เอกสาร API และการทดสอบ
│   ├── README.md                             - ภาพรวมการทดสอบ API
│   ├── TESTING_WORKFLOW.md                   - คู่มือเลือกวิธีทดสอบที่เหมาะสม
│   ├── API_TESTING_QUICKREF.md               - คู่มือฉบับย่อ (เริ่มที่นี่!)
│   ├── BOOKING_API_TEST.md                   - คู่มือทดสอบ Booking API (Postman)
│   ├── SU_Booking_Room_Postman_Collection.json   - Postman Collection (import ได้เลย)
│   ├── SU_Booking_Room_Postman_Environment.json  - Postman Environment
│   ├── test_booking_api.sh                   - Bash script ทดสอบอัตโนมัติ
│   ├── FRONTEND_API_GUIDE.md                 - คู่มือใช้งาน API ฝั่ง Frontend
│   └── API_TESTING.md                        - วิธีการทดสอบ API ทั่วไป
│
├── database/              # เอกสารฐานข้อมูล
│   ├── SQL_QUERIES.md              - คำสั่ง SQL ที่ใช้บ่อย
│   └── MIGRATION_FIX.md            - แก้ไขปัญหา Migration
│
├── docker/                # เอกสาร Docker
│   └── DOCKER_RESTART.md           - วิธีการ restart Docker services
│
├── architecture/          # สถาปัตยกรรมระบบ
│   ├── ARCHITECTURE.md             - สถาปัตยกรรมและโครงสร้างโปรเจค
│   ├── ARCHITECTURE_SIMPLE.md      - สถาปัตยกรรมแบบเข้าใจง่าย
│   └── REFACTOR_COMPARISON.md      - เปรียบเทียบก่อนและหลัง refactor
│
└── planning/              # แผนการพัฒนา
    └── BACKEND_PLAN.md             - แผนการพัฒนา Backend (8 Phases)
```

## 🚀 เริ่มต้นใช้งาน

สำหรับผู้ใช้งานครั้งแรก แนะนำให้อ่านตามลำดับ:

1. **[Quick Start Guide](guides/QUICK_START.md)** - เรียนรู้วิธีติดตั้งและรันโปรเจค
2. **[Architecture](architecture/ARCHITECTURE.md)** - ทำความเข้าใจโครงสร้างระบบ
3. **[Docker Guide](docker/DOCKER_RESTART.md)** - จัดการ Docker services
4. **[Makefile Guide](guides/MAKEFILE_GUIDE.md)** - เรียนรู้คำสั่งที่ใช้บ่อย

## 👨‍💻 สำหรับนักพัฒนา

### Backend Developer
1. **[Backend Quickstart](guides/BACKEND_QUICKSTART.md)** - เริ่มต้นพัฒนา Backend
2. **[Architecture](architecture/ARCHITECTURE.md)** - สถาปัตยกรรมระบบทั้งหมด
3. **[API Testing Quick Reference](api/API_TESTING_QUICKREF.md)** ⚡ - คู่มือทดสอบ API ฉบับย่อ
4. **[Booking API Test Guide](api/BOOKING_API_TEST.md)** - คู่มือทดสอบ Booking API แบบเต็ม
5. **[Database Queries](database/SQL_QUERIES.md)** - คำสั่ง SQL ที่ใช้บ่อย
6. **[Backend Plan](planning/BACKEND_PLAN.md)** - แผนการพัฒนา Backend

### Frontend Developer
1. **[Frontend Quickstart](guides/FRONTEND_QUICKSTART.md)** - เริ่มต้นพัฒนา Frontend
2. **[Frontend API Guide](api/FRONTEND_API_GUIDE.md)** - คู่มือใช้งาน API
3. **[Architecture](architecture/ARCHITECTURE.md)** - ทำความเข้าใจโครงสร้างระบบ

## 📝 หมวดหมู่เอกสาร

### 📖 Guides (คู่มือการใช้งาน)
เอกสารสำหรับผู้ใช้งานทั่วไปและนักพัฒนาใหม่ รวมถึงคู่มือการเริ่มต้นใช้งานทั้ง Backend และ Frontend

### 🌐 API (เอกสาร API)
เอกสารการใช้งาน API การทดสอบ Postman Collection ที่พร้อมใช้งาน และ Bash script สำหรับทดสอบอัตโนมัติ

### 🗄️ Database (ฐานข้อมูล)
คำสั่ง SQL ที่ใช้บ่อย วิธีการแก้ไขปัญหา Migration และเอกสารที่เกี่ยวกับฐานข้อมูล

### 🐳 Docker
คู่มือการจัดการ Docker services และการ restart containers

### 🏛️ Architecture (สถาปัตยกรรม)
โครงสร้างระบบ design decisions และ technical architecture

### 📝 Planning (แผนการพัฒนา)
แผนการทำงาน roadmap และ technical specifications

## 🔗 เอกสารที่เกี่ยวข้อง

- **[Root README](../README.md)** - ข้อมูลภาพรวมโปรเจค
- **[Backend README](../backend/README.md)** - เอกสารเฉพาะ Backend
- **[Frontend README](../frontend/README.md)** - เอกสารเฉพาะ Frontend
