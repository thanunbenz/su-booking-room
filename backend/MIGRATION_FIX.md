# 🔧 แก้ไข Migration Error

## ปัญหา
```
ERROR: there is no unique constraint matching given keys for referenced table "users"
```

## สาเหตุ
- Foreign key constraint ถูกสร้างผิด
- ลำดับการ migrate ไม่ถูกต้อง

## วิธีแก้ไข

### Option 1: Drop และสร้าง Database ใหม่ (แนะนำ)

```bash
# 1. เข้า psql
psql -U sumbenz -d postgres

# 2. Drop database เก่า
DROP DATABASE su_booking_room;

# 3. สร้าง database ใหม่
CREATE DATABASE su_booking_room;

# 4. ออกจาก psql
\q

# 5. รัน server ใหม่
cd backend
go run main.go
```

### Option 2: Drop Tables เฉพาะที่มีปัญหา

```sql
-- เข้า psql
psql -U sumbenz -d su_booking_room

-- Drop tables ตามลำดับ (child → parent)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS fixed_schedules CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ออกจาก psql
\q

-- รัน server ใหม่
go run main.go
```

### Option 3: ใช้ SQL Script

```bash
# รัน script
psql -U sumbenz -d su_booking_room < reset_db.sql
```

สร้างไฟล์ `reset_db.sql`:
```sql
-- Drop tables
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS fixed_schedules CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
```

## สิ่งที่แก้ไขแล้ว

1. ✅ แก้ลำดับ AutoMigrate ใน `config/database.go`
   - Migrate Role ก่อน User
   - แยก migrate แต่ละ model เพื่อจัดการ error ได้ดีขึ้น

2. ✅ เพิ่ม Role relation ใน User model

## หลังแก้ไขแล้ว

รัน server จะเห็น:
```
Successfully connected to database with GORM!
🌱 Starting database seeding...
✓ Created role: admin
✓ Created role: teacher
✓ Created role: visitor
✓ Created admin user:
  Email: admin@silpakorn.edu
  Password: admin123
  Role: Admin
✅ Database seeding completed!
🚀 Server starting on port 8000
📡 API available at http://localhost:8000/api/v1
```
