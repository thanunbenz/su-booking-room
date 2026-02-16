# 🌱 Seed API - คู่มือการใช้งาน

## ภาพรวม

Seed API สำหรับสร้าง mock data เพื่อทดสอบระบบจองห้อง

## API Endpoints

### 1. สร้าง Mock Data ทั้งหมด

**POST** `/api/v1/seed/all`

**Headers:**

```
Authorization: Bearer {admin_token}
```

**Response Success (201):**

```json
{
  "status": 200,
  "data": {
    "buildings_created": 3,
    "rooms_created": 8,
    "schedules_created": 4,
    "bookings_created": 5
  },
  "message": "Mock data seeded successfully"
}
```

**ข้อมูลที่สร้าง:**

- **3 ตึก:**
  - อาคาร 1 - อาคารเรียนรวมคณะวิทยาศาสตร์
  - อาคาร 2 - อาคารปฏิบัติการคอมพิวเตอร์
  - อาคาร 3 - อาคารบริการการศึกษา

- **8 ห้อง:**
  - อาคาร 1: ห้อง 101 (40 ที่นั่ง), ห้อง 102 (50 ที่นั่ง), Lab 103 (30 ที่นั่ง)
  - อาคาร 2: Lab 201 (35 ที่นั่ง), Lab 202 (45 ที่นั่ง), ห้อง 203 (60 ที่นั่ง)
  - อาคาร 3: ห้องประชุมใหญ่ (100 ที่นั่ง), ห้องประชุม 302 (25 ที่นั่ง)

- **4 ตารางการจอง:**
  - CS101 โครงสร้างข้อมูล (จันทร์ 09:00-12:00)
  - CS102 ระบบฐานข้อมูล (พุธ 13:00-16:00)
  - CS201 ปัญญาประดิษฐ์ (อังคาร 09:00-12:00)
  - CS202 Machine Learning (ศุกร์ 13:00-16:00)

- **5-6 การจอง:**
  - 2 Pending bookings (พรุ่งนี้)
  - 2 Approved bookings (อาทิตย์หน้า)
  - 1 Rejected booking
  - 1 Additional booking (ถ้ามี user ตัวที่ 2)

**Notes:**

- ต้อง login ด้วย admin account
- ต้องมี user อย่างน้อย 1 คนในระบบก่อน
- ถ้ามี building อยู่แล้วจะไม่สามารถ seed ได้ (ต้อง clear ก่อน)

---

### 2. ลบข้อมูลทั้งหมด

**DELETE** `/api/v1/seed/clear`

**Headers:**

```
Authorization: Bearer {admin_token}
```

**Response Success (200):**

```json
{
  "status": 200,
  "data": null,
  "message": "All data cleared successfully (except users and roles)"
}
```

**ข้อมูลที่ถูกลบ:**

- ✅ Buildings
- ✅ Rooms
- ✅ Fixed Schedules
- ✅ Bookings
- ❌ Users (ไม่ถูกลบ)
- ❌ Roles (ไม่ถูกลบ)

---

## วิธีใช้งาน

### ขั้นตอนที่ 1: เริ่มต้น Database และ Backend

```bash
# 1. Start PostgreSQL (Docker)
docker start <postgres_container_id>

# 2. Start Backend
cd backend
go run main.go
```

### ขั้นตอนที่ 2: Register และ Login (ถ้ายังไม่มี user)

```bash
# Register admin user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "fullname": "Admin User",
    "email": "admin@su.ac.th",
    "role_id": 1
  }'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Copy access_token จาก response
```

### ขั้นตอนที่ 3: สร้าง Mock Data

```bash
# แทนที่ YOUR_TOKEN ด้วย access_token ที่ได้จากการ login
curl -X POST http://localhost:8000/api/v1/seed/all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### ขั้นตอนที่ 4: ตรวจสอบข้อมูล

```bash
# ดู buildings
curl http://localhost:8000/api/v1/buildings

# ดู rooms
curl http://localhost:8000/api/v1/rooms

# ดู schedules
curl http://localhost:8000/api/v1/schedules

# ดู bookings (ต้อง login)
curl http://localhost:8000/api/v1/bookings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### ขั้นตอนที่ 5: ลบข้อมูล (เมื่อต้องการเริ่มใหม่)

```bash
curl -X DELETE http://localhost:8000/api/v1/seed/clear \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ใช้ใน Frontend

สามารถเรียกใช้ผ่าน API client:

```typescript
// seed-api.ts
export const seedApi = {
  seedAll: async () => {
    return apiCall("/seed/all", {
      method: "POST",
    });
  },

  clearAll: async () => {
    return apiCall("/seed/clear", {
      method: "DELETE",
    });
  },
};

// ใช้งาน
await seedApi.seedAll();
```

---

## Error Handling

### Database Already Has Data

```json
{
  "status": 400,
  "message": "Database already has data. Use /seed/clear first to reset."
}
```

**วิธีแก้:** เรียก DELETE `/api/v1/seed/clear` ก่อน

### No Users Found

```json
{
  "status": 400,
  "message": "No users found. Please register users first before seeding bookings."
}
```

**วิธีแก้:** Register user ก่อน

### Unauthorized

```json
{
  "status": 401,
  "message": "Missing or invalid token"
}
```

**วิธีแก้:** Login และใส่ token ใน Authorization header

### Forbidden (Not Admin)

```json
{
  "status": 403,
  "message": "Admin access required"
}
```

**วิธีแก้:** ใช้ admin account

---

## Tips

1. **ลำดับการทำงาน:**
   - Clear → Register Users → Seed All

2. **การทดสอบซ้ำ:**
   - ใช้ `/seed/clear` แล้วตามด้วย `/seed/all` ได้เลย

3. **ข้อมูลวันที่:**
   - Bookings จะถูกสร้างสำหรับ "พรุ่งนี้" และ "สัปดาห์หน้า" จากวันที่เรียก API

4. **การ debug:**
   - ดู console log ของ backend สำหรับ error details

---

## สรุป API Routes

| Method | Endpoint             | Description                    | Auth  |
| ------ | -------------------- | ------------------------------ | ----- |
| POST   | `/api/v1/seed/all`   | สร้าง mock data ทั้งหมด        | Admin |
| DELETE | `/api/v1/seed/clear` | ลบข้อมูลทั้งหมด (ยกเว้น users) | Admin |

---

**สร้างโดย:** Seed Handler
**Last Updated:** 2026-01-22
