#!/bin/bash

# Test Rate Limiting - พยายามจอง 15 ครั้ง (limit = 10)

echo "🧪 Testing Rate Limiting..."
echo "Expected: First 10 succeed, then 11-15 fail with 429"
echo ""

TOKEN="YOUR_JWT_TOKEN_HERE"
API_URL="http://localhost:8000/api/v1/bookings"

for i in {1..15}; do
    echo "Request #$i:"

    STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "$API_URL" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "room_id": 1,
            "booking_date": "2026-03-15",
            "start_time": "09:00",
            "end_time": "12:00",
            "title": "Test Rate Limit #'$i'",
            "purpose": "Testing"
        }')

    if [ "$STATUS" -eq 201 ]; then
        echo "  ✅ Success (201)"
    elif [ "$STATUS" -eq 429 ]; then
        echo "  ❌ Rate Limited! (429) 🎉"
    else
        echo "  ⚠️  Other error: $STATUS"
    fi

    sleep 0.5
done

echo ""
echo "✅ Test completed!"
echo "Rate limiting is working if requests 11-15 show 429"
