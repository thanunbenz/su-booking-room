# 📝 Booking Seed Data - ข้อมูลตัวอย่างสำหรับการจอง

คู่มือสำหรับสร้างข้อมูลการจอง (Bookings) ตัวอย่างด้วย raw SQL

---

## 🔧 วิธีใช้งาน

### 1. เตรียมข้อมูลพื้นฐาน

ก่อนสร้างข้อมูล bookings ต้องมีข้อมูลพื้นฐานดังนี้:
- Users (ต้องมี user อย่างน้อย 1 คน)
- Buildings (ตึก/อาคาร)
- Rooms (ห้องเรียน)

### 2. เช็คข้อมูลที่มีอยู่

```sql
-- ดู users ที่มี
SELECT user_id, email, fullname, role_id FROM users;

-- ดู buildings ที่มี
SELECT building_id, name FROM buildings;

-- ดู rooms ที่มี
SELECT room_id, name, building_id FROM rooms;
```

---

## 📦 SQL สำหรับสร้างข้อมูลพื้นฐาน

### 1. สร้าง Buildings (ถ้ายังไม่มี)

```sql
INSERT INTO buildings (name, description, created_at, updated_at)
VALUES
  ('อาคาร 1', 'อาคารเรียนรวมคณะวิทยาศาสตร์', NOW(), NOW()),
  ('อาคาร 2', 'อาคารปฏิบัติการคอมพิวเตอร์', NOW(), NOW()),
  ('อาคาร 3', 'อาคารบริการการศึกษา', NOW(), NOW())
ON CONFLICT DO NOTHING;
```

### 2. สร้าง Rooms (ถ้ายังไม่มี)

```sql
-- หา building_id ก่อน
-- SELECT building_id, name FROM buildings;

-- แทนที่ <building_1_id>, <building_2_id>, <building_3_id> ด้วย ID จริง
INSERT INTO rooms (building_id, name, capacity, description, created_at, updated_at)
VALUES
  -- อาคาร 1
  (1, 'ห้อง 101', 40, 'ห้องเรียนปกติ', NOW(), NOW()),
  (1, 'ห้อง 102', 50, 'ห้องเรียนใหญ่', NOW(), NOW()),
  (1, 'Lab 103', 30, 'ห้องปฏิบัติการคอมพิวเตอร์', NOW(), NOW()),

  -- อาคาร 2
  (2, 'Lab 201', 35, 'ห้องปฏิบัติการโปรแกรมมิ่ง', NOW(), NOW()),
  (2, 'Lab 202', 45, 'ห้องปฏิบัติการ AI/ML', NOW(), NOW()),
  (2, 'ห้อง 203', 60, 'ห้องบรรยายใหญ่', NOW(), NOW()),

  -- อาคาร 3
  (3, 'ห้องประชุมใหญ่', 100, 'ห้องจัดสัมมนา/งานใหญ่', NOW(), NOW()),
  (3, 'ห้องประชุม 302', 25, 'ห้องประชุมเล็ก', NOW(), NOW())
ON CONFLICT DO NOTHING;
```

### 3. สร้าง Fixed Schedules (ตารางเรียนประจำ)

```sql
-- หา room_id ก่อน
-- SELECT room_id, name FROM rooms;

-- แทนที่ <room_id> ด้วย ID จริง
INSERT INTO fixed_schedules (room_id, subject, teacher_name, day_of_week, start_time, end_time, semester)
VALUES
  -- ห้อง 101 - มีเรียนจันทร์ 09:00-12:00
  (1, 'CS101 โครงสร้างข้อมูล', 'อ. สมชาย ใจดี', 1, '09:00:00', '12:00:00', '1/2567'),

  -- ห้อง 101 - มีเรียนพุธ 13:00-16:00
  (1, 'CS102 ระบบฐานข้อมูล', 'อ. สมหญิง รักเรียน', 3, '13:00:00', '16:00:00', '1/2567'),

  -- Lab 201 - มีเรียนอังคาร 09:00-12:00
  (4, 'CS201 ปัญญาประดิษฐ์', 'อ. วิทยา คอมพิวเตอร์', 2, '09:00:00', '12:00:00', '1/2567'),

  -- Lab 201 - มีเรียนศุกร์ 13:00-16:00
  (4, 'CS202 Machine Learning', 'ผศ. ดร. ปัญญา สุขใจ', 5, '13:00:00', '16:00:00', '1/2567')
ON CONFLICT DO NOTHING;
```

---

## 📅 SQL สำหรับสร้างข้อมูล Bookings

### วิธีหา user_id และ room_id

```sql
-- ดู user_id
SELECT user_id, email, fullname FROM users LIMIT 5;

-- ดู room_id
SELECT r.room_id, r.name as room_name, b.name as building_name
FROM rooms r
JOIN buildings b ON r.building_id = b.building_id;
```

### สร้าง Bookings ตัวอย่าง (ใช้ user_id = 1)

```sql
-- ⚠️ สำคัญ: แทนที่ <user_id> ด้วย user_id จริงจากฐานข้อมูล
-- ตัวอย่างนี้ใช้ user_id = 1

-- คำนวณวันที่
-- CURRENT_DATE = วันนี้
-- CURRENT_DATE + INTERVAL '1 day' = พรุ่งนี้
-- CURRENT_DATE + INTERVAL '7 days' = อาทิตย์หน้า

-- ล้างข้อมูล bookings เก่า (ถ้าต้องการ)
-- DELETE FROM bookings;

-- 1. Booking - สถานะ Pending (รอการอนุมัติ)
INSERT INTO bookings (
  user_id, room_id, title, detail, equipment_request,
  booking_date, start_time, end_time, status, status_note,
  created_at, updated_at
)
VALUES
  (
    1,  -- แทนที่ด้วย user_id จริง
    1,  -- ห้อง 101
    'ประชุมโครงงาน',
    'ประชุมเตรียมนำเสนอโครงงานครั้งที่ 1',
    'โปรเจคเตอร์ 1 เครื่อง',
    CURRENT_DATE + INTERVAL '1 day',  -- พรุ่งนี้
    '09:00:00',
    '11:00:00',
    'pending',
    NULL,
    NOW(),
    NOW()
  );

-- 2. Booking - สถานะ Pending (รอการอนุมัติ)
INSERT INTO bookings (
  user_id, room_id, title, detail, equipment_request,
  booking_date, start_time, end_time, status, status_note,
  created_at, updated_at
)
VALUES
  (
    1,
    2,  -- ห้อง 102
    'ทำงานกลุ่ม',
    'ทำงานกลุ่มวิชา Data Science',
    'คอมพิวเตอร์ 5 เครื่อง',
    CURRENT_DATE + INTERVAL '1 day',
    '13:00:00',
    '15:00:00',
    'pending',
    NULL,
    NOW(),
    NOW()
  );

-- 3. Booking - สถานะ Approved (อนุมัติแล้ว)
INSERT INTO bookings (
  user_id, room_id, title, detail, equipment_request,
  booking_date, start_time, end_time, status, status_note,
  created_at, updated_at
)
VALUES
  (
    1,
    3,  -- Lab 103
    'Workshop Python',
    'สอน Python พื้นฐานให้น้องๆ',
    'โปรเจคเตอร์ 1 เครื่อง, คอมพิวเตอร์ 20 เครื่อง',
    CURRENT_DATE + INTERVAL '7 days',  -- อาทิตย์หน้า
    '09:00:00',
    '12:00:00',
    'approved',
    'อนุมัติแล้ว',
    NOW(),
    NOW()
  );

-- 4. Booking - สถานะ Approved (อนุมัติแล้ว)
INSERT INTO bookings (
  user_id, room_id, title, detail, equipment_request,
  booking_date, start_time, end_time, status, status_note,
  created_at, updated_at
)
VALUES
  (
    1,
    5,  -- Lab 202
    'สอบกลางภาค',
    'สอบวิชา Web Development',
    'คอมพิวเตอร์ 30 เครื่อง',
    CURRENT_DATE + INTERVAL '7 days',
    '13:00:00',
    '16:00:00',
    'approved',
    'อนุมัติแล้ว',
    NOW(),
    NOW()
  );

-- 5. Booking - สถานะ Rejected (ปฏิเสธ)
INSERT INTO bookings (
  user_id, room_id, title, detail, equipment_request,
  booking_date, start_time, end_time, status, status_note,
  created_at, updated_at
)
VALUES
  (
    1,
    1,  -- ห้อง 101
    'ซ้อมดนตรี',
    'ซ้อมดนตรีประกอบการแสดง',
    'เครื่องเสียง 1 ชุด',
    CURRENT_DATE + INTERVAL '1 day',
    '16:00:00',
    '18:00:00',
    'rejected',
    'ห้องไม่เหมาะสมสำหรับซ้อมดนตรี กรุณาติดต่อฝ่ายกิจการนักศึกษา',
    NOW(),
    NOW()
  );

-- 6. Booking - สถานะ Cancelled (ยกเลิกแล้ว)
INSERT INTO bookings (
  user_id, room_id, title, detail, equipment_request,
  booking_date, start_time, end_time, status, status_note,
  created_at, updated_at
)
VALUES
  (
    1,
    2,  -- ห้อง 102
    'อบรม Git & GitHub',
    'อบรมการใช้งาน Git สำหรับนักศึกษา',
    'โปรเจคเตอร์ 1 เครื่อง',
    CURRENT_DATE + INTERVAL '3 days',
    '09:00:00',
    '12:00:00',
    'cancelled',
    'ยกเลิกโดยผู้จอง',
    NOW(),
    NOW()
  );

-- 7. Booking - สถานะ Completed (เสร็จสิ้น - ใช้วันที่ย้อนหลัง)
INSERT INTO bookings (
  user_id, room_id, title, detail, equipment_request,
  booking_date, start_time, end_time, status, status_note,
  created_at, updated_at
)
VALUES
  (
    1,
    4,  -- Lab 201
    'ฝึกทำโปรเจค',
    'ฝึกทำโปรเจคจบ',
    'คอมพิวเตอร์ 10 เครื่อง',
    CURRENT_DATE - INTERVAL '2 days',  -- เมื่อ 2 วันก่อน
    '13:00:00',
    '17:00:00',
    'completed',
    'เสร็จสิ้นแล้ว',
    NOW() - INTERVAL '3 days',
    NOW()
  );
```

---

## 🔍 ตรวจสอบข้อมูลที่สร้าง

```sql
-- ดู bookings ทั้งหมด พร้อมข้อมูลห้องและตึก
SELECT
  b.booking_id,
  b.title,
  b.booking_date,
  b.start_time,
  b.end_time,
  b.status,
  r.name as room_name,
  bld.name as building_name,
  u.fullname as user_name
FROM bookings b
JOIN rooms r ON b.room_id = r.room_id
JOIN buildings bld ON r.building_id = bld.building_id
JOIN users u ON b.user_id = u.user_id
ORDER BY b.booking_date DESC, b.start_time ASC;
```

```sql
-- นับจำนวน bookings แยกตามสถานะ
SELECT
  status,
  COUNT(*) as count
FROM bookings
GROUP BY status
ORDER BY
  CASE status
    WHEN 'pending' THEN 1
    WHEN 'approved' THEN 2
    WHEN 'rejected' THEN 3
    WHEN 'cancelled' THEN 4
    WHEN 'completed' THEN 5
  END;
```

---

## 🧹 ล้างข้อมูล (ถ้าต้องการเริ่มใหม่)

```sql
-- ⚠️ คำเตือน: คำสั่งนี้จะลบข้อมูลทั้งหมด!

-- ลบ bookings เท่านั้น
DELETE FROM bookings;

-- ลบทั้งหมด (ยกเว้น users และ roles)
DELETE FROM bookings;
DELETE FROM fixed_schedules;
DELETE FROM rooms;
DELETE FROM buildings;

-- Reset auto-increment counters (PostgreSQL)
ALTER SEQUENCE bookings_booking_id_seq RESTART WITH 1;
ALTER SEQUENCE fixed_schedules_schedule_id_seq RESTART WITH 1;
ALTER SEQUENCE rooms_room_id_seq RESTART WITH 1;
ALTER SEQUENCE buildings_building_id_seq RESTART WITH 1;
```

---

## 📋 ตัวอย่างสถานการณ์การใช้งาน

### สร้าง booking หลายสถานะสำหรับทดสอบ

```sql
-- ใช้ในกรณีต้องการข้อมูลทดสอบแบบครบทุกสถานะ
WITH user_info AS (
  SELECT user_id FROM users LIMIT 1
)
INSERT INTO bookings (
  user_id, room_id, title, detail, equipment_request,
  booking_date, start_time, end_time, status, status_note,
  created_at, updated_at
)
SELECT
  (SELECT user_id FROM user_info),
  (SELECT room_id FROM rooms ORDER BY RANDOM() LIMIT 1),
  'ทดสอบ - ' || status_type.status_name,
  'ข้อมูลทดสอบสำหรับสถานะ ' || status_type.status_name,
  CASE
    WHEN random() > 0.5 THEN 'โปรเจคเตอร์ 1 เครื่อง'
    ELSE NULL
  END,
  CURRENT_DATE + (random() * 14)::int,  -- สุ่มวันที่ 0-14 วันข้างหน้า
  '09:00:00',
  '11:00:00',
  status_type.status_code,
  status_type.note,
  NOW(),
  NOW()
FROM (
  VALUES
    ('pending', 'รอการอนุมัติ', NULL),
    ('approved', 'อนุมัติแล้ว', 'อนุมัติโดยแอดมิน'),
    ('rejected', 'ปฏิเสธ', 'ห้องไม่ว่างในช่วงเวลานี้'),
    ('cancelled', 'ยกเลิกแล้ว', 'ยกเลิกโดยผู้จอง'),
    ('completed', 'เสร็จสิ้น', 'เสร็จสิ้นแล้ว')
) AS status_type(status_code, status_name, note);
```

---

## 💡 Tips & Best Practices

### 1. ตรวจสอบข้อมูลก่อน Insert
```sql
-- ดู user_id ที่มีอยู่
SELECT user_id, email, fullname FROM users;

-- ดู room_id ที่ว่าง
SELECT r.room_id, r.name, b.name as building
FROM rooms r
JOIN buildings b ON r.building_id = b.building_id
WHERE NOT EXISTS (
  SELECT 1 FROM bookings
  WHERE room_id = r.room_id
  AND booking_date = CURRENT_DATE + INTERVAL '1 day'
  AND status IN ('pending', 'approved')
);
```

### 2. หลีกเลี่ยงการจองซ้อนเวลา
```sql
-- ตรวจสอบว่ามีการจองซ้อนเวลาหรือไม่
SELECT b.*, r.name
FROM bookings b
JOIN rooms r ON b.room_id = r.room_id
WHERE b.room_id = 1  -- แทนที่ด้วย room_id ที่ต้องการ
  AND b.booking_date = '2026-01-26'  -- แทนที่ด้วยวันที่ที่ต้องการ
  AND b.status IN ('pending', 'approved')
  AND (
    (b.start_time < '11:00:00' AND b.end_time > '09:00:00')  -- แทนที่ด้วยเวลาที่ต้องการจอง
  );
```

### 3. ใช้ Transaction สำหรับ Insert หลายรายการ
```sql
BEGIN;

INSERT INTO bookings (...) VALUES (...);
INSERT INTO bookings (...) VALUES (...);
INSERT INTO bookings (...) VALUES (...);

-- ตรวจสอบข้อมูลก่อน COMMIT
SELECT * FROM bookings ORDER BY created_at DESC LIMIT 10;

-- ถ้าถูกต้อง
COMMIT;

-- ถ้าผิด
-- ROLLBACK;
```

---

## 📞 ติดต่อ & สนับสนุน

หากมีปัญหาหรือข้อสงสัย:
- ดู error logs ที่ backend console
- ตรวจสอบ constraints และ foreign keys
- อ่าน [CLAUDE.md](./CLAUDE.md) สำหรับรายละเอียดเพิ่มเติม

---

**เวอร์ชัน:** 1.0.0
**อัพเดทล่าสุด:** 2026-01-25
**ผู้ดูแล:** Sumbenz
