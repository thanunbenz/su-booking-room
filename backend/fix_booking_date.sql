-- แก้ไข booking_id 7 ให้ start_time และ end_time ตรงกับ booking_date
UPDATE bookings 
SET 
  start_time = '13:00:00',
  end_time = '15:00:00'
WHERE booking_id = 7;

-- เพิ่มข้อมูลจองใหม่สำหรับวันที่ 25 มกราคม 2569
INSERT INTO bookings (user_id, room_id, title, detail, equipment_request, booking_date, start_time, end_time, status, status_note)
VALUES 
  (1, 3, 'ประชุมคณะกรรมการ', 'ประชุมวางแผนภาคเรียนใหม่', 'โปรเจคเตอร์, ไมค์', '2026-01-25', '09:00:00', '11:00:00', 'approved', 'อนุมัติแล้ว'),
  (1, 5, 'Workshop AI', 'สอน Machine Learning เบื้องต้น', 'คอมพิวเตอร์ 25 เครื่อง, โปรเจคเตอร์', '2026-01-25', '14:00:00', '17:00:00', 'approved', 'อนุมัติแล้ว');

-- ตรวจสอบข้อมูล
SELECT booking_id, room_id, title, booking_date, start_time, end_time, status 
FROM bookings 
WHERE booking_date = '2026-01-25'
ORDER BY start_time;
