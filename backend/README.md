# SU Booking Room - Backend

Backend API สำหรับระบบจองห้องของมหาวิทยาลัย พัฒนาด้วย Go Fiber Framework

## โครงสร้างโปรเจ็กต์

```
backend/
├── cmd/
│   └── api/              # Entry point ของแอปพลิเคชัน
├── internal/             # Private application code
│   ├── handlers/         # HTTP request handlers
│   ├── middleware/       # Custom middleware functions
│   ├── models/           # Data models และ structs
│   ├── repositories/     # Data access layer (Database operations)
│   ├── routes/           # Route definitions
│   ├── services/         # Business logic layer
│   └── utils/            # Utility functions และ helpers
├── pkg/                  # Public libraries (ใช้ได้จาก external packages)
├── api/                  # API specifications (OpenAPI/Swagger)
├── configs/              # Configuration files
├── migrations/           # Database migration files
├── docs/                 # Documentation
├── .env.example          # ตัวอย่างไฟล์ environment variables
├── .gitignore           # Git ignore rules
├── go.mod               # Go module dependencies
└── main.go              # Main application file
```

## รายละเอียดแต่ละ Directory

### `/cmd/api`
- Entry point ของ API server
- จัดการการเริ่มต้น application และ configuration loading

### `/internal`
โค้ดที่เป็น private สำหรับโปรเจ็กต์นี้เท่านั้น

- **handlers/** - HTTP handlers สำหรับจัดการ requests/responses
- **middleware/** - Custom middleware เช่น authentication, logging, CORS
- **models/** - Database models และ data structures
- **repositories/** - Data access layer สำหรับติดต่อ database
- **routes/** - การกำหนด API routes และ endpoints
- **services/** - Business logic และ core functionality
- **utils/** - Helper functions และ utilities

### `/pkg`
- Public libraries ที่สามารถ import ใช้จาก projects อื่นได้
- Reusable packages

### `/api`
- API documentation
- OpenAPI/Swagger specifications

### `/configs`
- Configuration files สำหรับ environments ต่างๆ
- Database configuration
- Application settings

### `/migrations`
- Database migration files
- Schema versions และ changes

### `/docs`
- Project documentation
- API guides
- Development guides

## การติดตั้งและใช้งาน

### Prerequisites
- Go 1.21 หรือสูงกว่า
- PostgreSQL 14+
- Redis (optional)

### Installation

1. Clone repository
```bash
git clone <repository-url>
cd su-booking-room/backend
```

2. Install dependencies
```bash
go mod download
```

3. Setup environment variables
```bash
cp .env.example .env
# แก้ไขค่าใน .env ตามต้องการ
```

4. Run database migrations
```bash
# คำสั่งจะเพิ่มเติมภายหลัง
```

5. Run the application
```bash
go run main.go
```

## Development

### Project Structure Best Practices

- ใช้ **handlers** สำหรับจัดการ HTTP requests เท่านั้น
- ย้าย business logic ไปไว้ใน **services**
- แยก database operations ไปไว้ใน **repositories**
- ใช้ **models** สำหรับ data structures ร่วมกัน
- เขียน middleware แยกไว้ใน **middleware** directory

### Coding Guidelines

- Follow Go standard coding conventions
- ใช้ meaningful variable และ function names
- เขียน comments สำหรับ public functions
- Handle errors properly
- Write unit tests

## API Documentation

API documentation จะอยู่ที่ `/api/docs` เมื่อ server running

## License

[ระบุ License ของโปรเจ็กต์]
