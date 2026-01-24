#!/bin/bash

# ==============================================================================
# SU Booking Room - Booking API Test Script
# ==============================================================================
# วิธีใช้:
#   chmod +x test_booking_api.sh
#   ./test_booking_api.sh
# ==============================================================================

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:8000"
API_VERSION="/api/v1"
API_URL="${BASE_URL}${API_VERSION}"

# Credentials
ADMIN_EMAIL="admin@su.ac.th"
ADMIN_PASSWORD="admin123"
USER_EMAIL="user@su.ac.th"
USER_PASSWORD="user123"

# Variables
ACCESS_TOKEN=""
USER_ACCESS_TOKEN=""
BOOKING_ID=""

# ==============================================================================
# Helper Functions
# ==============================================================================

print_section() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_request() {
    echo -e "${BLUE}📤 Request: $1${NC}"
}

print_response() {
    echo -e "${GREEN}📥 Response:${NC}"
    echo "$1" | jq '.' 2>/dev/null || echo "$1"
    echo ""
}

# ==============================================================================
# Test Functions
# ==============================================================================

# 1. Login as Admin
test_login_admin() {
    print_section "1. Login as Admin"
    print_request "POST ${API_URL}/auth/login"

    RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"${ADMIN_EMAIL}\",
            \"password\": \"${ADMIN_PASSWORD}\"
        }")

    print_response "$RESPONSE"

    # Extract access token
    ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.data.access_token' 2>/dev/null)

    if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
        print_success "Admin login successful"
        print_info "Access Token: ${ACCESS_TOKEN:0:50}..."
    else
        print_error "Admin login failed"
        exit 1
    fi
}

# 2. Login as User
test_login_user() {
    print_section "2. Login as Regular User"
    print_request "POST ${API_URL}/auth/login"

    RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"${USER_EMAIL}\",
            \"password\": \"${USER_PASSWORD}\"
        }")

    print_response "$RESPONSE"

    # Extract access token
    USER_ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.data.access_token' 2>/dev/null)

    if [ "$USER_ACCESS_TOKEN" != "null" ] && [ -n "$USER_ACCESS_TOKEN" ]; then
        print_success "User login successful"
    else
        print_error "User login failed"
    fi
}

# 3. Get Current User
test_get_current_user() {
    print_section "3. Get Current User"
    print_request "GET ${API_URL}/auth/me"

    RESPONSE=$(curl -s -X GET "${API_URL}/auth/me" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")

    print_response "$RESPONSE"

    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        print_success "Get current user successful"
    else
        print_error "Get current user failed"
    fi
}

# 4. Get All Buildings
test_get_buildings() {
    print_section "4. Get All Buildings (Public)"
    print_request "GET ${API_URL}/buildings"

    RESPONSE=$(curl -s -X GET "${API_URL}/buildings")

    print_response "$RESPONSE"

    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        print_success "Get buildings successful"
    fi
}

# 5. Get All Rooms
test_get_rooms() {
    print_section "5. Get All Rooms (Public)"
    print_request "GET ${API_URL}/rooms"

    RESPONSE=$(curl -s -X GET "${API_URL}/rooms")

    print_response "$RESPONSE"

    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        print_success "Get rooms successful"
    fi
}

# 6. Get Room Availability
test_get_room_availability() {
    print_section "6. Get Room Availability (Public)"

    TOMORROW=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "tomorrow" +%Y-%m-%d 2>/dev/null)

    print_request "GET ${API_URL}/rooms/1/availability?date=${TOMORROW}"

    RESPONSE=$(curl -s -X GET "${API_URL}/rooms/1/availability?date=${TOMORROW}")

    print_response "$RESPONSE"

    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        print_success "Get room availability successful"
    fi
}

# 7. Create Booking (Valid)
test_create_booking_valid() {
    print_section "7. Create Booking (Valid)"

    TOMORROW=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "tomorrow" +%Y-%m-%d 2>/dev/null)

    print_request "POST ${API_URL}/bookings"
    print_info "Date: ${TOMORROW}, Time: 14:00-16:00"

    RESPONSE=$(curl -s -X POST "${API_URL}/bookings" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"room_id\": 1,
            \"title\": \"ประชุมกลุ่ม\",
            \"detail\": \"ทดสอบจาก API Test Script\",
            \"equipment_request\": \"โปรเจคเตอร์ 1 เครื่อง\",
            \"booking_date\": \"${TOMORROW}\",
            \"start_time\": \"14:00\",
            \"end_time\": \"16:00\"
        }")

    print_response "$RESPONSE"

    # Extract booking ID
    BOOKING_ID=$(echo "$RESPONSE" | jq -r '.data.booking_id' 2>/dev/null)

    if [ "$BOOKING_ID" != "null" ] && [ -n "$BOOKING_ID" ]; then
        print_success "Create booking successful (ID: ${BOOKING_ID})"
    else
        print_error "Create booking failed"
    fi
}

# 8. Create Booking (Time Conflict - Should Fail)
test_create_booking_conflict() {
    print_section "8. Create Booking with Time Conflict (Should Fail)"

    TOMORROW=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "tomorrow" +%Y-%m-%d 2>/dev/null)

    print_request "POST ${API_URL}/bookings"
    print_info "Date: ${TOMORROW}, Time: 15:00-17:00 (ซ้อนกับการจองก่อนหน้า)"

    RESPONSE=$(curl -s -X POST "${API_URL}/bookings" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"room_id\": 1,
            \"title\": \"การจองซ้อนทับ\",
            \"booking_date\": \"${TOMORROW}\",
            \"start_time\": \"15:00\",
            \"end_time\": \"17:00\"
        }")

    print_response "$RESPONSE"

    if echo "$RESPONSE" | jq -e '.error.code == "CONFLICT"' > /dev/null 2>&1; then
        print_success "Time conflict detected correctly ✓"
    else
        print_error "Time conflict NOT detected (this is a bug!)"
    fi
}

# 9. Create Booking (Invalid Time - Should Fail)
test_create_booking_invalid_time() {
    print_section "9. Create Booking with Invalid Time (Should Fail)"

    TOMORROW=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "tomorrow" +%Y-%m-%d 2>/dev/null)

    print_request "POST ${API_URL}/bookings"
    print_info "Date: ${TOMORROW}, Time: 17:00-15:00 (start > end)"

    RESPONSE=$(curl -s -X POST "${API_URL}/bookings" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"room_id\": 1,
            \"title\": \"เวลาผิด\",
            \"booking_date\": \"${TOMORROW}\",
            \"start_time\": \"17:00\",
            \"end_time\": \"15:00\"
        }")

    print_response "$RESPONSE"

    if echo "$RESPONSE" | jq -e '.error.code == "BAD_REQUEST"' > /dev/null 2>&1; then
        print_success "Invalid time range detected correctly ✓"
    else
        print_error "Invalid time range NOT detected"
    fi
}

# 10. Create Booking (Past Date - Should Fail)
test_create_booking_past_date() {
    print_section "10. Create Booking in the Past (Should Fail)"

    print_request "POST ${API_URL}/bookings"
    print_info "Date: 2024-01-01 (in the past)"

    RESPONSE=$(curl -s -X POST "${API_URL}/bookings" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "room_id": 1,
            "title": "จองย้อนหลัง",
            "booking_date": "2024-01-01",
            "start_time": "09:00",
            "end_time": "11:00"
        }')

    print_response "$RESPONSE"

    if echo "$RESPONSE" | jq -e '.error.code == "BAD_REQUEST"' > /dev/null 2>&1; then
        print_success "Past date detected correctly ✓"
    else
        print_error "Past date NOT detected"
    fi
}

# 11. Get My Bookings
test_get_my_bookings() {
    print_section "11. Get My Bookings"
    print_request "GET ${API_URL}/bookings/my"

    RESPONSE=$(curl -s -X GET "${API_URL}/bookings/my" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")

    print_response "$RESPONSE"

    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        COUNT=$(echo "$RESPONSE" | jq '.data | length' 2>/dev/null)
        print_success "Get my bookings successful (${COUNT} bookings found)"
    fi
}

# 12. Get All Bookings (Admin)
test_get_all_bookings() {
    print_section "12. Get All Bookings (Admin Only)"
    print_request "GET ${API_URL}/bookings"

    RESPONSE=$(curl -s -X GET "${API_URL}/bookings" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")

    print_response "$RESPONSE"

    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        COUNT=$(echo "$RESPONSE" | jq '.data | length' 2>/dev/null)
        print_success "Get all bookings successful (${COUNT} total bookings)"
    fi
}

# 13. Get Booking by ID
test_get_booking_by_id() {
    print_section "13. Get Booking by ID"

    if [ -z "$BOOKING_ID" ]; then
        print_error "No booking ID available (skip test)"
        return
    fi

    print_request "GET ${API_URL}/bookings/${BOOKING_ID}"

    RESPONSE=$(curl -s -X GET "${API_URL}/bookings/${BOOKING_ID}" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")

    print_response "$RESPONSE"

    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        print_success "Get booking by ID successful"
    fi
}

# 14. Update Booking Status - Approve (Admin)
test_approve_booking() {
    print_section "14. Approve Booking (Admin Only)"

    if [ -z "$BOOKING_ID" ]; then
        print_error "No booking ID available (skip test)"
        return
    fi

    print_request "PATCH ${API_URL}/bookings/${BOOKING_ID}/status"

    RESPONSE=$(curl -s -X PATCH "${API_URL}/bookings/${BOOKING_ID}/status" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "status": "approved",
            "status_note": "อนุมัติโดย Test Script"
        }')

    print_response "$RESPONSE"

    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        print_success "Approve booking successful"
    fi
}

# 15. Cancel Booking
test_cancel_booking() {
    print_section "15. Cancel Booking"

    if [ -z "$BOOKING_ID" ]; then
        print_error "No booking ID available (skip test)"
        return
    fi

    print_request "DELETE ${API_URL}/bookings/${BOOKING_ID}/cancel"

    RESPONSE=$(curl -s -X DELETE "${API_URL}/bookings/${BOOKING_ID}/cancel" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")

    print_response "$RESPONSE"

    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        print_success "Cancel booking successful"
    fi
}

# 16. Test Permission - User accessing Admin endpoint (Should Fail)
test_permission_user_admin_endpoint() {
    print_section "16. Permission Test - User accessing Admin endpoint (Should Fail)"

    if [ -z "$USER_ACCESS_TOKEN" ]; then
        print_error "No user access token available (skip test)"
        return
    fi

    print_request "GET ${API_URL}/bookings (with user token)"

    RESPONSE=$(curl -s -X GET "${API_URL}/bookings" \
        -H "Authorization: Bearer ${USER_ACCESS_TOKEN}")

    print_response "$RESPONSE"

    if echo "$RESPONSE" | jq -e '.error.code == "FORBIDDEN"' > /dev/null 2>&1; then
        print_success "Permission check working correctly ✓"
    else
        print_error "Permission check NOT working (security issue!)"
    fi
}

# ==============================================================================
# Main Test Runner
# ==============================================================================

main() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║   SU Booking Room - Booking API Test Script              ║"
    echo "║   Testing: ${BASE_URL}${API_VERSION}                     ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed. Please install jq to run this script."
        print_info "Install: brew install jq (macOS) or apt-get install jq (Linux)"
        exit 1
    fi

    # Check if server is running
    print_info "Checking if server is running..."
    if ! curl -s "${BASE_URL}${API_VERSION}/health" > /dev/null 2>&1; then
        print_error "Server is not running at ${BASE_URL}"
        print_info "Please start the server first: cd backend && go run main.go"
        exit 1
    fi
    print_success "Server is running!"

    # Run tests
    test_login_admin
    test_login_user
    test_get_current_user
    test_get_buildings
    test_get_rooms
    test_get_room_availability
    test_create_booking_valid
    test_create_booking_conflict
    test_create_booking_invalid_time
    test_create_booking_past_date
    test_get_my_bookings
    test_get_all_bookings
    test_get_booking_by_id
    test_approve_booking
    test_cancel_booking
    test_permission_user_admin_endpoint

    # Summary
    print_section "Test Summary"
    print_success "All tests completed!"
    echo ""
    print_info "Access Token: ${ACCESS_TOKEN:0:50}..."
    print_info "Last Booking ID: ${BOOKING_ID}"
}

# Run main function
main
