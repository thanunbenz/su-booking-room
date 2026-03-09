#!/bin/bash

# Test Notification API
# Usage: ./test_notification_api.sh YOUR_JWT_TOKEN

BASE_URL="http://localhost:8000/api/v1"
TOKEN="${1:-YOUR_JWT_TOKEN_HERE}"

echo "🧪 Testing Notification API"
echo "================================"
echo ""

# Test 1: Get My Notifications
echo "1️⃣ GET /notifications/my"
echo "---"
curl -s -X GET "$BASE_URL/notifications/my" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

# Test 2: Get Unread Only
echo "2️⃣ GET /notifications/my?unread_only=true"
echo "---"
curl -s -X GET "$BASE_URL/notifications/my?unread_only=true" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

# Test 3: Mark as Read (replace :id with actual notification_id)
NOTIFICATION_ID=1
echo "3️⃣ PATCH /notifications/$NOTIFICATION_ID/read"
echo "---"
curl -s -X PATCH "$BASE_URL/notifications/$NOTIFICATION_ID/read" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

# Test 4: Mark All as Read
echo "4️⃣ PATCH /notifications/read-all"
echo "---"
curl -s -X PATCH "$BASE_URL/notifications/read-all" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

# Test 5: Delete Notification (replace :id with actual notification_id)
NOTIFICATION_ID=1
echo "5️⃣ DELETE /notifications/$NOTIFICATION_ID"
echo "---"
curl -s -X DELETE "$BASE_URL/notifications/$NOTIFICATION_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

echo "✅ Testing completed!"
