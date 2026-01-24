-- Fix booking time columns to use TIME type instead of TIMESTAMP
-- วิธีใช้:
-- Option 1 (with psql): psql -U sumbenz -d su_booking_room -f fix_booking_time_columns.sql
-- Option 2 (with docker): docker exec -i su-booking-db psql -U sumbenz -d su_booking_room < fix_booking_time_columns.sql

-- ลบข้อมูล bookings ที่มีอยู่ (ถ้ามี) เพื่อหลีกเลี่ยงปัญหา type conversion
TRUNCATE TABLE bookings CASCADE;

-- เปลี่ยน column type เป็น TIME
ALTER TABLE bookings ALTER COLUMN start_time TYPE time USING start_time::time;
ALTER TABLE bookings ALTER COLUMN end_time TYPE time USING end_time::time;

-- ตรวจสอบว่าเปลี่ยนสำเร็จ
SELECT
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'bookings'
AND column_name IN ('start_time', 'end_time');

-- แสดงข้อความสำเร็จ
SELECT 'Booking time columns fixed successfully! Now you can run seed API.' AS message;
