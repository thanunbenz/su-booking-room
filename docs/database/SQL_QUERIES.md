# SQL Raw Queries สำหรับทุกเส้น API

เอกสารนี้รวบรวม SQL queries ทั้งหมดสำหรับทุกเส้น API ในระบบ SU Booking Room

---

## 📋 Table of Contents

- [Authentication APIs](#authentication-apis)
- [Building APIs](#building-apis)
- [Room APIs](#room-apis)

---

## Authentication APIs

### 1. POST /api/v1/auth/login

**คำอธิบาย:** Login เข้าระบบด้วย email และ password

**Query 1: หา user จาก email พร้อม role**
```sql
SELECT
    u.user_id, u.email, u.password, u.fullname, u.username,
    u.role_id, u.created_at, u.updated_at,
    r.role_id, r.role_name, r.description, r.created_at
FROM users u
INNER JOIN roles r ON u.role_id = r.role_id
WHERE u.email = $1
LIMIT 1;
```
**Parameters:**
- `$1`: email (string)

---

### 2. POST /api/v1/auth/register

**คำอธิบาย:** ลงทะเบียนผู้ใช้ใหม่

**Query 1: ตรวจสอบ email ซ้ำ**
```sql
SELECT COUNT(*) as count
FROM users
WHERE email = $1;
```
**Parameters:**
- `$1`: email (string)

**Query 2: สร้าง user ใหม่**
```sql
INSERT INTO users (email, password, fullname, username, role_id, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
RETURNING user_id;
```
**Parameters:**
- `$1`: email (string)
- `$2`: hashed_password (string)
- `$3`: fullname (string)
- `$4`: username (string)
- `$5`: role_id (int, default: 3 สำหรับ Visitor)

**Query 3: โหลด role relation**
```sql
SELECT
    u.user_id, u.email, u.password, u.fullname, u.username,
    u.role_id, u.created_at, u.updated_at,
    r.role_id, r.role_name, r.description, r.created_at
FROM users u
INNER JOIN roles r ON u.role_id = r.role_id
WHERE u.user_id = $1
LIMIT 1;
```
**Parameters:**
- `$1`: user_id (int)

---

### 3. GET /api/v1/auth/me

**คำอธิบาย:** ดึงข้อมูล user ที่ login อยู่

**Query 1: ดึงข้อมูล user พร้อม role**
```sql
SELECT
    u.user_id, u.email, u.password, u.fullname, u.username,
    u.role_id, u.created_at, u.updated_at,
    r.role_id, r.role_name, r.description, r.created_at
FROM users u
INNER JOIN roles r ON u.role_id = r.role_id
WHERE u.user_id = $1
LIMIT 1;
```
**Parameters:**
- `$1`: user_id (int - จาก JWT token)

---

## Building APIs

### 4. GET /api/v1/buildings

**คำอธิบาย:** ดึงข้อมูล buildings ทั้งหมด

**Query 1: ดึง buildings ทั้งหมด**
```sql
SELECT building_id, name, description, created_at
FROM buildings
ORDER BY created_at DESC;
```

---

### 5. GET /api/v1/buildings/:id

**คำอธิบาย:** ดึงข้อมูล building ตาม ID

**Query 1: ดึง building ตาม ID**
```sql
SELECT building_id, name, description, created_at
FROM buildings
WHERE building_id = $1
LIMIT 1;
```
**Parameters:**
- `$1`: building_id (int)

---

### 6. POST /api/v1/buildings

**คำอธิบาย:** สร้าง building ใหม่ (Admin only)

**Query 1: ตรวจสอบชื่อ building ซ้ำ**
```sql
SELECT COUNT(*) as count
FROM buildings
WHERE name = $1;
```
**Parameters:**
- `$1`: name (string)

**Query 2: สร้าง building**
```sql
INSERT INTO buildings (name, description, created_at)
VALUES ($1, $2, NOW())
RETURNING building_id;
```
**Parameters:**
- `$1`: name (string)
- `$2`: description (string)

---

### 7. PUT /api/v1/buildings/:id

**คำอธิบาย:** แก้ไข building (Admin only)

**Query 1: ตรวจสอบว่า building มีอยู่**
```sql
SELECT building_id, name, description, created_at
FROM buildings
WHERE building_id = $1
LIMIT 1;
```
**Parameters:**
- `$1`: building_id (int)

**Query 2: อัปเดต building**
```sql
UPDATE buildings
SET name = $1, description = $2
WHERE building_id = $3
RETURNING building_id, name, description, created_at;
```
**Parameters:**
- `$1`: name (string)
- `$2`: description (string)
- `$3`: building_id (int)

---

### 8. DELETE /api/v1/buildings/:id

**คำอธิบาย:** ลบ building (Admin only)

**Query 1: ลบ building**
```sql
DELETE FROM buildings
WHERE building_id = $1;
```
**Parameters:**
- `$1`: building_id (int)

**หมายเหตุ:** ควรตรวจสอบ rows affected เพื่อดูว่ามีการลบจริงหรือไม่

---

## Room APIs

### 9. GET /api/v1/rooms

**คำอธิบาย:** ดึงข้อมูล rooms ทั้งหมด พร้อม building

**Query 1: ดึง rooms ทั้งหมดพร้อม building**
```sql
SELECT
    r.room_id, r.building_id, r.name, r.capacity, r.description, r.created_at,
    b.building_id, b.name, b.description, b.created_at
FROM rooms r
INNER JOIN buildings b ON r.building_id = b.building_id
ORDER BY r.created_at DESC;
```

---

### 10. GET /api/v1/rooms/:id

**คำอธิบาย:** ดึงข้อมูล room ตาม ID พร้อม building

**Query 1: ดึง room ตาม ID พร้อม building**
```sql
SELECT
    r.room_id, r.building_id, r.name, r.capacity, r.description, r.created_at,
    b.building_id, b.name, b.description, b.created_at
FROM rooms r
INNER JOIN buildings b ON r.building_id = b.building_id
WHERE r.room_id = $1
LIMIT 1;
```
**Parameters:**
- `$1`: room_id (int)

---

### 11. GET /api/v1/buildings/:id/rooms

**คำอธิบาย:** ดึงข้อมูล rooms ในตึกที่ระบุ

**Query 1: ตรวจสอบว่า building มีอยู่**
```sql
SELECT building_id, name, description, created_at
FROM buildings
WHERE building_id = $1
LIMIT 1;
```
**Parameters:**
- `$1`: building_id (int)

**Query 2: ดึง rooms ในตึกนั้น**
```sql
SELECT
    r.room_id, r.building_id, r.name, r.capacity, r.description, r.created_at,
    b.building_id, b.name, b.description, b.created_at
FROM rooms r
INNER JOIN buildings b ON r.building_id = b.building_id
WHERE r.building_id = $1
ORDER BY r.name ASC;
```
**Parameters:**
- `$1`: building_id (int)

---

### 12. POST /api/v1/rooms

**คำอธิบาย:** สร้าง room ใหม่ (Admin only)

**Query 1: ตรวจสอบว่า building มีอยู่**
```sql
SELECT building_id, name, description, created_at
FROM buildings
WHERE building_id = $1
LIMIT 1;
```
**Parameters:**
- `$1`: building_id (int)

**Query 2: ตรวจสอบชื่อ room ซ้ำในตึกเดียวกัน**
```sql
SELECT COUNT(*) as count
FROM rooms
WHERE building_id = $1 AND name = $2;
```
**Parameters:**
- `$1`: building_id (int)
- `$2`: name (string)

**Query 3: สร้าง room**
```sql
INSERT INTO rooms (building_id, name, capacity, description, created_at)
VALUES ($1, $2, $3, $4, NOW())
RETURNING room_id;
```
**Parameters:**
- `$1`: building_id (int)
- `$2`: name (string)
- `$3`: capacity (int)
- `$4`: description (string)

**Query 4: โหลด room พร้อม building relation**
```sql
SELECT
    r.room_id, r.building_id, r.name, r.capacity, r.description, r.created_at,
    b.building_id, b.name, b.description, b.created_at
FROM rooms r
INNER JOIN buildings b ON r.building_id = b.building_id
WHERE r.room_id = $1
LIMIT 1;
```
**Parameters:**
- `$1`: room_id (int)

---

### 13. PUT /api/v1/rooms/:id

**คำอธิบาย:** แก้ไข room (Admin only)

**Query 1: ตรวจสอบว่า room มีอยู่**
```sql
SELECT room_id, building_id, name, capacity, description, created_at
FROM rooms
WHERE room_id = $1
LIMIT 1;
```
**Parameters:**
- `$1`: room_id (int)

**Query 2: ตรวจสอบว่า building ใหม่มีอยู่ (ถ้ามีการเปลี่ยน)**
```sql
SELECT building_id, name, description, created_at
FROM buildings
WHERE building_id = $1
LIMIT 1;
```
**Parameters:**
- `$1`: building_id (int)

**Query 3: ตรวจสอบชื่อ room ซ้ำในตึกเดียวกัน (ถ้ามีการเปลี่ยนชื่อ)**
```sql
SELECT COUNT(*) as count
FROM rooms
WHERE building_id = $1 AND name = $2 AND room_id != $3;
```
**Parameters:**
- `$1`: building_id (int)
- `$2`: name (string)
- `$3`: room_id (int)

**Query 4: อัปเดต room**
```sql
UPDATE rooms
SET name = $1, building_id = $2, capacity = $3, description = $4
WHERE room_id = $5
RETURNING room_id;
```
**Parameters:**
- `$1`: name (string)
- `$2`: building_id (int)
- `$3`: capacity (int)
- `$4`: description (string)
- `$5`: room_id (int)

**Query 5: โหลด room พร้อม building relation**
```sql
SELECT
    r.room_id, r.building_id, r.name, r.capacity, r.description, r.created_at,
    b.building_id, b.name, b.description, b.created_at
FROM rooms r
INNER JOIN buildings b ON r.building_id = b.building_id
WHERE r.room_id = $1
LIMIT 1;
```
**Parameters:**
- `$1`: room_id (int)

---

### 14. DELETE /api/v1/rooms/:id

**คำอธิบาย:** ลบ room (Admin only)

**Query 1: ลบ room**
```sql
DELETE FROM rooms
WHERE room_id = $1;
```
**Parameters:**
- `$1`: room_id (int)

**หมายเหตุ:** ควรตรวจสอบ rows affected เพื่อดูว่ามีการลบจริงหรือไม่

---

## 📌 หมายเหตุสำคัญ

### Placeholder Syntax
- PostgreSQL ใช้ `$1, $2, $3...` สำหรับ parameters
- MySQL ใช้ `?` สำหรับ parameters
- SQLite ใช้ `?` หรือ `:name` สำหรับ parameters

### Default Values
- `role_id = 3` สำหรับ user ใหม่ (Visitor role)
- `created_at` และ `updated_at` ใช้ `NOW()` function

### Security
- ใช้ prepared statements กับทุก query เพื่อป้องกัน SQL Injection
- Password ต้อง hash ด้วย bcrypt ก่อนบันทึก
- JWT token ใช้สำหรับ authentication

### Performance Tips
- ใช้ index บน `email`, `username`, `role_id`, `building_id`
- ใช้ `LIMIT 1` เมื่อต้องการแค่ 1 row
- ใช้ `INNER JOIN` เพื่อดึงข้อมูล relations

---

## 🔍 การใช้งาน

### ตัวอย่าง (Go + database/sql)

```go
// Query example
var user User
err := db.QueryRow(
    "SELECT user_id, email, fullname FROM users WHERE email = $1",
    email,
).Scan(&user.UserID, &user.Email, &user.Fullname)

if err == sql.ErrNoRows {
    // ไม่พบข้อมูล
} else if err != nil {
    // มี error อื่น
}
```

### ตัวอย่าง (Go + GORM)

```go
// GORM จะแปลงเป็น SQL โดยอัตโนมัติ
var user User
result := db.Where("email = ?", email).First(&user)

if errors.Is(result.Error, gorm.ErrRecordNotFound) {
    // ไม่พบข้อมูล
}
```

---

**สร้างโดย:** Claude Code
**วันที่:** 2026-01-18
**เวอร์ชัน:** 1.0.0
