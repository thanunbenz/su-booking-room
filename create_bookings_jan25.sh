#!/bin/bash

# ต้อง login ก่อนเพื่อเอา token
echo "กรุณา login และใส่ access_token:"
read -r TOKEN

# สร้างการจองที่ 1: ประชุมคณะกรรมการ
curl -X POST http://127.0.0.1:8000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "room_id": 3,
    "title": "ประชุมคณะกรรมการ",
    "detail": "ประชุมวางแผนภาคเรียนใหม่",
    "equipment_request": "โปรเจคเตอร์, ไมค์",
    "booking_date": "2026-01-25",
    "start_time": "09:00",
    "end_time": "11:00"
  }'

echo -e "\n\n"

# สร้างการจองที่ 2: Workshop AI
curl -X POST http://127.0.0.1:8000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "room_id": 5,
    "title": "Workshop AI",
    "detail": "สอน Machine Learning เบื้องต้น",
    "equipment_request": "คอมพิวเตอร์ 25 เครื่อง, โปรเจคเตอร์",
    "booking_date": "2026-01-25",
    "start_time": "14:00",
    "end_time": "17:00"
  }'

echo -e "\n\nเสร็จสิ้น!"
