-- Reset Database Script
-- วิธีใช้: psql -U sumbenz -d su_booking_room -f reset_db.sql

-- Drop tables ตามลำดับ (child → parent) เพื่อหลีกเลี่ยง foreign key constraints
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS fixed_schedules CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- แสดงข้อความสำเร็จ
SELECT 'Database tables dropped successfully! You can now run: go run main.go' AS message;
