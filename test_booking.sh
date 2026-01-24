#!/bin/bash

# Test Booking API Script
# สคริปต์ทดสอบ API การจองห้อง

BASE_URL="http://127.0.0.1:8000/api/v1"

echo "================================"
echo "🧪 SU Booking Room API Test"
echo "================================"
echo ""

# Step 1: Login to get token
echo "📝 Step 1: Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@su.ac.th",
    "password": "admin123"
  }')

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq '.'
echo ""

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed! Cannot get token."
  echo "Please make sure:"
  echo "  1. Backend server is running"
  echo "  2. Database has admin user (email: admin@su.ac.th, password: admin123)"
  echo ""
  echo "Run this to create admin user:"
  echo "  POST $BASE_URL/seed/all"
  exit 1
fi

echo "✅ Login successful!"
echo "Token: ${TOKEN:0:50}..."
echo ""

# Step 2: Get available rooms
echo "📝 Step 2: Get available rooms..."
ROOMS_RESPONSE=$(curl -s -X GET "$BASE_URL/rooms")
echo "$ROOMS_RESPONSE" | jq '.data[0:3]' # แสดงแค่ 3 ห้องแรก
echo ""

ROOM_ID=$(echo "$ROOMS_RESPONSE" | jq -r '.data[0].room_id // 1')
echo "Will use Room ID: $ROOM_ID"
echo ""

# Step 3: Create a booking
echo "📝 Step 3: Create a new booking..."
TOMORROW=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "tomorrow" +%Y-%m-%d 2>/dev/null || echo "2026-01-26")

echo "Booking Date: $TOMORROW"
echo ""

BOOKING_RESPONSE=$(curl -s -X POST "$BASE_URL/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"room_id\": $ROOM_ID,
    \"title\": \"ประชุมกลุ่มทดสอบ API\",
    \"detail\": \"ทดสอบการจองห้องผ่าน API\",
    \"equipment_request\": \"โปรเจคเตอร์ 1 เครื่อง\",
    \"booking_date\": \"$TOMORROW\",
    \"start_time\": \"09:00\",
    \"end_time\": \"11:00\"
  }")

echo "Booking Response:"
echo "$BOOKING_RESPONSE" | jq '.'
echo ""

# Check if booking was successful
SUCCESS=$(echo "$BOOKING_RESPONSE" | jq -r '.success // false')

if [ "$SUCCESS" = "true" ]; then
  echo "✅ Booking created successfully!"
  BOOKING_ID=$(echo "$BOOKING_RESPONSE" | jq -r '.data.booking_id')
  echo "Booking ID: $BOOKING_ID"
else
  echo "❌ Booking failed!"
  ERROR_MSG=$(echo "$BOOKING_RESPONSE" | jq -r '.error.message')
  echo "Error: $ERROR_MSG"
fi

echo ""
echo "================================"
echo "🎯 Test completed!"
echo "================================"
