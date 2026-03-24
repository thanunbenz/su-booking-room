package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"testing"
	"time"
)

// Test configuration
var (
	baseURL    = getTestBaseURL()
	adminToken string
	testUserToken string
)

func getTestBaseURL() string {
	if url := os.Getenv("TEST_API_URL"); url != "" {
		return url
	}
	return "http://localhost:8000/api/v1"
}

// Helper types for API responses
type APIResponse struct {
	Success bool            `json:"success"`
	Data    json.RawMessage `json:"data"`
	Message string          `json:"message"`
}

type APIError struct {
	Success bool `json:"success"`
	Error   struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

type LoginResponseData struct {
	User   json.RawMessage `json:"user"`
	Tokens struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		TokenType    string `json:"token_type"`
	} `json:"tokens"`
}

// Helper functions
func makeRequest(t *testing.T, method, endpoint string, body interface{}, token string) (*http.Response, []byte) {
	t.Helper()

	var reqBody io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("Failed to marshal request body: %v", err)
		}
		reqBody = bytes.NewBuffer(jsonBody)
	}

	req, err := http.NewRequest(method, baseURL+endpoint, reqBody)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}

	respBody, err := io.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		t.Fatalf("Failed to read response body: %v", err)
	}

	return resp, respBody
}

func checkServerAvailable(t *testing.T) {
	t.Helper()
	client := &http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get(baseURL + "/health")
	if err != nil {
		t.Skip("Backend server not running, skipping integration tests")
	}
	resp.Body.Close()
	if resp.StatusCode != 200 {
		t.Skip("Backend server not healthy, skipping integration tests")
	}
}

func getAdminToken(t *testing.T) string {
	t.Helper()
	if adminToken != "" {
		return adminToken
	}

	body := map[string]string{
		"email":    "admin@silpakorn.edu",
		"password": "password123",
	}

	resp, respBody := makeRequest(t, "POST", "/auth/login", body, "")
	if resp.StatusCode != 200 {
		t.Fatalf("Admin login failed: %s", string(respBody))
	}

	var apiResp APIResponse
	json.Unmarshal(respBody, &apiResp)

	var loginData LoginResponseData
	json.Unmarshal(apiResp.Data, &loginData)

	adminToken = loginData.Tokens.AccessToken
	return adminToken
}

// ======================================
// Health Check Tests
// ======================================

func TestHealth(t *testing.T) {
	checkServerAvailable(t)

	resp, body := makeRequest(t, "GET", "/health", nil, "")

	if resp.StatusCode != 200 {
		t.Errorf("Health check status = %d, want 200", resp.StatusCode)
	}

	var result map[string]string
	json.Unmarshal(body, &result)
	if result["status"] != "ok" {
		t.Errorf("Health status = %q, want 'ok'", result["status"])
	}
}

// ======================================
// Auth Tests
// ======================================

func TestAuth_LoginValidCredentials(t *testing.T) {
	checkServerAvailable(t)

	body := map[string]string{
		"email":    "admin@silpakorn.edu",
		"password": "password123",
	}

	resp, respBody := makeRequest(t, "POST", "/auth/login", body, "")

	if resp.StatusCode != 200 {
		t.Errorf("Login status = %d, want 200. Body: %s", resp.StatusCode, string(respBody))
	}

	var apiResp APIResponse
	json.Unmarshal(respBody, &apiResp)

	if !apiResp.Success {
		t.Error("Login response success = false, want true")
	}

	var loginData LoginResponseData
	json.Unmarshal(apiResp.Data, &loginData)

	if loginData.Tokens.AccessToken == "" {
		t.Error("Login did not return access_token")
	}
	if loginData.Tokens.RefreshToken == "" {
		t.Error("Login did not return refresh_token")
	}
	if loginData.Tokens.TokenType != "Bearer" {
		t.Errorf("Token type = %q, want 'Bearer'", loginData.Tokens.TokenType)
	}
}

func TestAuth_LoginInvalidPassword(t *testing.T) {
	checkServerAvailable(t)

	body := map[string]string{
		"email":    "admin@silpakorn.edu",
		"password": "wrongpassword",
	}

	resp, _ := makeRequest(t, "POST", "/auth/login", body, "")

	if resp.StatusCode != 401 {
		t.Errorf("Login with wrong password status = %d, want 401", resp.StatusCode)
	}
}

func TestAuth_LoginNonExistentUser(t *testing.T) {
	checkServerAvailable(t)

	body := map[string]string{
		"email":    "nonexistent@silpakorn.edu",
		"password": "password123",
	}

	resp, _ := makeRequest(t, "POST", "/auth/login", body, "")

	if resp.StatusCode != 404 {
		t.Errorf("Login with non-existent user status = %d, want 404", resp.StatusCode)
	}
}

func TestAuth_LoginMissingFields(t *testing.T) {
	checkServerAvailable(t)

	body := map[string]string{
		"email": "admin@silpakorn.edu",
	}

	resp, _ := makeRequest(t, "POST", "/auth/login", body, "")

	if resp.StatusCode != 400 {
		t.Errorf("Login with missing password status = %d, want 400", resp.StatusCode)
	}
}

func TestAuth_LoginInvalidEmail(t *testing.T) {
	checkServerAvailable(t)

	body := map[string]string{
		"email":    "not-an-email",
		"password": "password123",
	}

	resp, _ := makeRequest(t, "POST", "/auth/login", body, "")

	if resp.StatusCode != 400 {
		t.Errorf("Login with invalid email status = %d, want 400", resp.StatusCode)
	}
}

func TestAuth_LoginShortPassword(t *testing.T) {
	checkServerAvailable(t)

	body := map[string]string{
		"email":    "admin@silpakorn.edu",
		"password": "123",
	}

	resp, _ := makeRequest(t, "POST", "/auth/login", body, "")

	if resp.StatusCode != 400 {
		t.Errorf("Login with short password status = %d, want 400", resp.StatusCode)
	}
}

func TestAuth_GetMe(t *testing.T) {
	checkServerAvailable(t)
	token := getAdminToken(t)

	resp, respBody := makeRequest(t, "GET", "/auth/me", nil, token)

	if resp.StatusCode != 200 {
		t.Errorf("GetMe status = %d, want 200. Body: %s", resp.StatusCode, string(respBody))
	}

	var apiResp APIResponse
	json.Unmarshal(respBody, &apiResp)
	if !apiResp.Success {
		t.Error("GetMe response success = false, want true")
	}
}

func TestAuth_GetMeNoToken(t *testing.T) {
	checkServerAvailable(t)

	resp, _ := makeRequest(t, "GET", "/auth/me", nil, "")

	if resp.StatusCode != 401 {
		t.Errorf("GetMe without token status = %d, want 401", resp.StatusCode)
	}
}

func TestAuth_GetMeInvalidToken(t *testing.T) {
	checkServerAvailable(t)

	resp, _ := makeRequest(t, "GET", "/auth/me", nil, "invalid-token-here")

	if resp.StatusCode != 401 {
		t.Errorf("GetMe with invalid token status = %d, want 401", resp.StatusCode)
	}
}

func TestAuth_RegisterNonSilpakornEmail(t *testing.T) {
	checkServerAvailable(t)

	body := map[string]string{
		"email":    "test@gmail.com",
		"password": "password123",
		"fullname": "Test User",
		"username": "testuser_gmail",
	}

	resp, _ := makeRequest(t, "POST", "/auth/register", body, "")

	if resp.StatusCode != 400 {
		t.Errorf("Register with non-silpakorn email status = %d, want 400", resp.StatusCode)
	}
}

func TestAuth_RegisterMissingFields(t *testing.T) {
	checkServerAvailable(t)

	body := map[string]string{
		"email": "test@silpakorn.edu",
	}

	resp, _ := makeRequest(t, "POST", "/auth/register", body, "")

	if resp.StatusCode != 400 {
		t.Errorf("Register with missing fields status = %d, want 400", resp.StatusCode)
	}
}

func TestAuth_RegisterDuplicateEmail(t *testing.T) {
	checkServerAvailable(t)

	body := map[string]string{
		"email":    "admin@silpakorn.edu",
		"password": "password123",
		"fullname": "Duplicate Admin",
		"username": "dupadmin",
	}

	resp, _ := makeRequest(t, "POST", "/auth/register", body, "")

	if resp.StatusCode != 409 {
		t.Errorf("Register with duplicate email status = %d, want 409", resp.StatusCode)
	}
}

// ======================================
// Building Tests
// ======================================

func TestBuildings_GetAll(t *testing.T) {
	checkServerAvailable(t)

	resp, respBody := makeRequest(t, "GET", "/buildings", nil, "")

	if resp.StatusCode != 200 {
		t.Errorf("GetAll buildings status = %d, want 200. Body: %s", resp.StatusCode, string(respBody))
	}

	var apiResp APIResponse
	json.Unmarshal(respBody, &apiResp)
	if !apiResp.Success {
		t.Error("GetAll buildings success = false, want true")
	}
}

func TestBuildings_GetByID(t *testing.T) {
	checkServerAvailable(t)

	// Get all buildings first
	_, respBody := makeRequest(t, "GET", "/buildings", nil, "")
	var apiResp APIResponse
	json.Unmarshal(respBody, &apiResp)

	var buildings []map[string]interface{}
	json.Unmarshal(apiResp.Data, &buildings)

	if len(buildings) == 0 {
		t.Skip("No buildings in database to test GetByID")
	}

	buildingID := int(buildings[0]["building_id"].(float64))
	resp, _ := makeRequest(t, "GET", fmt.Sprintf("/buildings/%d", buildingID), nil, "")

	if resp.StatusCode != 200 {
		t.Errorf("GetByID building status = %d, want 200", resp.StatusCode)
	}
}

func TestBuildings_GetByID_NotFound(t *testing.T) {
	checkServerAvailable(t)

	resp, _ := makeRequest(t, "GET", "/buildings/99999", nil, "")

	if resp.StatusCode != 404 {
		t.Errorf("GetByID non-existent building status = %d, want 404", resp.StatusCode)
	}
}

func TestBuildings_CreateWithoutAuth(t *testing.T) {
	checkServerAvailable(t)

	body := map[string]string{
		"name":        "Unauthorized Building",
		"description": "Should fail",
	}

	resp, _ := makeRequest(t, "POST", "/buildings", body, "")

	if resp.StatusCode != 401 {
		t.Errorf("Create building without auth status = %d, want 401", resp.StatusCode)
	}
}

func TestBuildings_CreateMissingName(t *testing.T) {
	checkServerAvailable(t)
	token := getAdminToken(t)

	body := map[string]string{
		"description": "Missing name",
	}

	resp, _ := makeRequest(t, "POST", "/buildings", body, token)

	if resp.StatusCode != 400 {
		t.Errorf("Create building without name status = %d, want 400", resp.StatusCode)
	}
}

func TestBuildings_CRUD(t *testing.T) {
	checkServerAvailable(t)
	token := getAdminToken(t)

	// Create
	createBody := map[string]string{
		"name":        fmt.Sprintf("Test Building %d", time.Now().UnixNano()),
		"description": "Test building for integration test",
	}

	resp, respBody := makeRequest(t, "POST", "/buildings", createBody, token)
	if resp.StatusCode != 201 {
		t.Fatalf("Create building status = %d, want 201. Body: %s", resp.StatusCode, string(respBody))
	}

	var createResp APIResponse
	json.Unmarshal(respBody, &createResp)
	var building map[string]interface{}
	json.Unmarshal(createResp.Data, &building)
	buildingID := int(building["building_id"].(float64))

	// Update
	updateBody := map[string]string{
		"name":        fmt.Sprintf("Updated Building %d", time.Now().UnixNano()),
		"description": "Updated description",
	}

	resp, _ = makeRequest(t, "PUT", fmt.Sprintf("/buildings/%d", buildingID), updateBody, token)
	if resp.StatusCode != 200 {
		t.Errorf("Update building status = %d, want 200", resp.StatusCode)
	}

	// Delete
	resp, _ = makeRequest(t, "DELETE", fmt.Sprintf("/buildings/%d", buildingID), nil, token)
	if resp.StatusCode != 200 {
		t.Errorf("Delete building status = %d, want 200", resp.StatusCode)
	}

	// Verify deleted
	resp, _ = makeRequest(t, "GET", fmt.Sprintf("/buildings/%d", buildingID), nil, "")
	if resp.StatusCode != 404 {
		t.Errorf("Get deleted building status = %d, want 404", resp.StatusCode)
	}
}

// ======================================
// Room Tests
// ======================================

func TestRooms_GetAll(t *testing.T) {
	checkServerAvailable(t)

	resp, _ := makeRequest(t, "GET", "/rooms", nil, "")

	if resp.StatusCode != 200 {
		t.Errorf("GetAll rooms status = %d, want 200", resp.StatusCode)
	}
}

func TestRooms_GetByID_NotFound(t *testing.T) {
	checkServerAvailable(t)

	resp, _ := makeRequest(t, "GET", "/rooms/99999", nil, "")

	if resp.StatusCode != 404 {
		t.Errorf("GetByID non-existent room status = %d, want 404", resp.StatusCode)
	}
}

func TestRooms_CreateWithoutAuth(t *testing.T) {
	checkServerAvailable(t)

	body := map[string]interface{}{
		"name":        "Unauthorized Room",
		"building_id": 1,
		"capacity":    30,
	}

	resp, _ := makeRequest(t, "POST", "/rooms", body, "")

	if resp.StatusCode != 401 {
		t.Errorf("Create room without auth status = %d, want 401", resp.StatusCode)
	}
}

func TestRooms_CreateMissingName(t *testing.T) {
	checkServerAvailable(t)
	token := getAdminToken(t)

	body := map[string]interface{}{
		"building_id": 1,
		"capacity":    30,
	}

	resp, _ := makeRequest(t, "POST", "/rooms", body, token)

	if resp.StatusCode != 400 {
		t.Errorf("Create room without name status = %d, want 400", resp.StatusCode)
	}
}

func TestRooms_CreateMissingBuildingID(t *testing.T) {
	checkServerAvailable(t)
	token := getAdminToken(t)

	body := map[string]interface{}{
		"name":     "Room Without Building",
		"capacity": 30,
	}

	resp, _ := makeRequest(t, "POST", "/rooms", body, token)

	if resp.StatusCode != 400 {
		t.Errorf("Create room without building_id status = %d, want 400", resp.StatusCode)
	}
}

func TestRooms_GetByBuildingID(t *testing.T) {
	checkServerAvailable(t)

	// Get first building
	_, respBody := makeRequest(t, "GET", "/buildings", nil, "")
	var apiResp APIResponse
	json.Unmarshal(respBody, &apiResp)

	var buildings []map[string]interface{}
	json.Unmarshal(apiResp.Data, &buildings)

	if len(buildings) == 0 {
		t.Skip("No buildings to test rooms by building ID")
	}

	buildingID := int(buildings[0]["building_id"].(float64))
	resp, _ := makeRequest(t, "GET", fmt.Sprintf("/buildings/%d/rooms", buildingID), nil, "")

	if resp.StatusCode != 200 {
		t.Errorf("GetByBuildingID rooms status = %d, want 200", resp.StatusCode)
	}
}

// ======================================
// Booking Tests
// ======================================

func TestBookings_GetMyWithoutAuth(t *testing.T) {
	checkServerAvailable(t)

	resp, _ := makeRequest(t, "GET", "/bookings/my", nil, "")

	if resp.StatusCode != 401 {
		t.Errorf("GetMyBookings without auth status = %d, want 401", resp.StatusCode)
	}
}

func TestBookings_GetMyWithAuth(t *testing.T) {
	checkServerAvailable(t)
	token := getAdminToken(t)

	resp, _ := makeRequest(t, "GET", "/bookings/my", nil, token)

	if resp.StatusCode != 200 {
		t.Errorf("GetMyBookings with auth status = %d, want 200", resp.StatusCode)
	}
}

func TestBookings_GetAll(t *testing.T) {
	checkServerAvailable(t)

	resp, _ := makeRequest(t, "GET", "/bookings", nil, "")

	if resp.StatusCode != 200 {
		t.Errorf("GetAll bookings status = %d, want 200", resp.StatusCode)
	}
}

func TestBookings_GetAllWithFilters(t *testing.T) {
	checkServerAvailable(t)

	// Filter by status
	resp, _ := makeRequest(t, "GET", "/bookings?status=approved", nil, "")
	if resp.StatusCode != 200 {
		t.Errorf("GetAll bookings with status filter status = %d, want 200", resp.StatusCode)
	}

	// Filter by date
	resp, _ = makeRequest(t, "GET", "/bookings?booking_date=2026-04-01", nil, "")
	if resp.StatusCode != 200 {
		t.Errorf("GetAll bookings with date filter status = %d, want 200", resp.StatusCode)
	}
}

func TestBookings_CreateWithoutAuth(t *testing.T) {
	checkServerAvailable(t)

	body := map[string]interface{}{
		"room_id":      1,
		"title":        "Unauthorized Booking",
		"booking_date": "2026-12-25",
		"start_time":   "09:00",
		"end_time":     "10:00",
	}

	resp, _ := makeRequest(t, "POST", "/bookings", body, "")

	if resp.StatusCode != 401 {
		t.Errorf("Create booking without auth status = %d, want 401", resp.StatusCode)
	}
}

func TestBookings_CreateInvalidTimeRange(t *testing.T) {
	checkServerAvailable(t)
	token := getAdminToken(t)

	// Get a valid room ID
	_, roomsBody := makeRequest(t, "GET", "/rooms", nil, "")
	var roomsResp APIResponse
	json.Unmarshal(roomsBody, &roomsResp)

	var rooms []map[string]interface{}
	json.Unmarshal(roomsResp.Data, &rooms)
	if len(rooms) == 0 {
		t.Skip("No rooms available")
	}

	roomID := int(rooms[0]["room_id"].(float64))

	// End time before start time
	body := map[string]interface{}{
		"room_id":      roomID,
		"title":        "Bad Time Booking",
		"booking_date": "2026-12-25",
		"start_time":   "12:00",
		"end_time":     "09:00",
	}

	resp, _ := makeRequest(t, "POST", "/bookings", body, token)

	if resp.StatusCode != 400 {
		t.Errorf("Create booking with invalid time range status = %d, want 400", resp.StatusCode)
	}
}

func TestBookings_CreatePastDate(t *testing.T) {
	checkServerAvailable(t)
	token := getAdminToken(t)

	// Get a valid room ID
	_, roomsBody := makeRequest(t, "GET", "/rooms", nil, "")
	var roomsResp APIResponse
	json.Unmarshal(roomsBody, &roomsResp)

	var rooms []map[string]interface{}
	json.Unmarshal(roomsResp.Data, &rooms)
	if len(rooms) == 0 {
		t.Skip("No rooms available")
	}

	roomID := int(rooms[0]["room_id"].(float64))

	body := map[string]interface{}{
		"room_id":      roomID,
		"title":        "Past Date Booking",
		"booking_date": "2020-01-01",
		"start_time":   "09:00",
		"end_time":     "10:00",
	}

	resp, _ := makeRequest(t, "POST", "/bookings", body, token)

	if resp.StatusCode != 400 {
		t.Errorf("Create booking in the past status = %d, want 400", resp.StatusCode)
	}
}

func TestBookings_CreateNonExistentRoom(t *testing.T) {
	checkServerAvailable(t)
	token := getAdminToken(t)

	body := map[string]interface{}{
		"room_id":      99999,
		"title":        "Ghost Room Booking",
		"booking_date": "2026-12-25",
		"start_time":   "09:00",
		"end_time":     "10:00",
	}

	resp, _ := makeRequest(t, "POST", "/bookings", body, token)

	if resp.StatusCode != 404 {
		t.Errorf("Create booking for non-existent room status = %d, want 404", resp.StatusCode)
	}
}

func TestBookings_UpdateStatusWithoutAuth(t *testing.T) {
	checkServerAvailable(t)

	body := map[string]string{
		"status": "approved",
	}

	resp, _ := makeRequest(t, "PATCH", "/bookings/1/status", body, "")

	if resp.StatusCode != 401 {
		t.Errorf("UpdateStatus without auth status = %d, want 401", resp.StatusCode)
	}
}

func TestBookings_UpdateStatusInvalid(t *testing.T) {
	checkServerAvailable(t)
	token := getAdminToken(t)

	// Get a booking ID
	_, bookingsBody := makeRequest(t, "GET", "/bookings", nil, "")
	var bookingsResp APIResponse
	json.Unmarshal(bookingsBody, &bookingsResp)

	var bookings []map[string]interface{}
	json.Unmarshal(bookingsResp.Data, &bookings)
	if len(bookings) == 0 {
		t.Skip("No bookings to test status update")
	}

	bookingID := int(bookings[0]["booking_id"].(float64))

	body := map[string]string{
		"status": "invalid_status",
	}

	resp, _ := makeRequest(t, "PATCH", fmt.Sprintf("/bookings/%d/status", bookingID), body, token)

	if resp.StatusCode != 400 {
		t.Errorf("UpdateStatus with invalid status value status = %d, want 400", resp.StatusCode)
	}
}

func TestBookings_CancelWithoutAuth(t *testing.T) {
	checkServerAvailable(t)

	resp, _ := makeRequest(t, "DELETE", "/bookings/1/cancel", nil, "")

	if resp.StatusCode != 401 {
		t.Errorf("Cancel booking without auth status = %d, want 401", resp.StatusCode)
	}
}

func TestBookings_GetByID_NotFound(t *testing.T) {
	checkServerAvailable(t)
	token := getAdminToken(t)

	resp, _ := makeRequest(t, "GET", "/bookings/99999", nil, token)

	if resp.StatusCode != 404 {
		t.Errorf("GetByID non-existent booking status = %d, want 404", resp.StatusCode)
	}
}

func TestBookings_InvalidDateFormat(t *testing.T) {
	checkServerAvailable(t)

	resp, _ := makeRequest(t, "GET", "/bookings?booking_date=not-a-date", nil, "")

	if resp.StatusCode != 400 {
		t.Errorf("GetAll bookings with invalid date format status = %d, want 400", resp.StatusCode)
	}
}

// ======================================
// User Tests (Admin only)
// ======================================

func TestUsers_GetAllWithoutAuth(t *testing.T) {
	checkServerAvailable(t)

	resp, _ := makeRequest(t, "GET", "/users", nil, "")

	if resp.StatusCode != 401 {
		t.Errorf("GetAll users without auth status = %d, want 401", resp.StatusCode)
	}
}

func TestUsers_GetAllWithAdmin(t *testing.T) {
	checkServerAvailable(t)
	token := getAdminToken(t)

	resp, _ := makeRequest(t, "GET", "/users", nil, token)

	if resp.StatusCode != 200 {
		t.Errorf("GetAll users as admin status = %d, want 200", resp.StatusCode)
	}
}

func TestUsers_GetByID_NotFound(t *testing.T) {
	checkServerAvailable(t)
	token := getAdminToken(t)

	resp, _ := makeRequest(t, "GET", "/users/99999", nil, token)

	if resp.StatusCode != 404 {
		t.Errorf("GetByID non-existent user status = %d, want 404", resp.StatusCode)
	}
}

func TestUsers_SearchByName(t *testing.T) {
	checkServerAvailable(t)
	token := getAdminToken(t)

	resp, _ := makeRequest(t, "GET", "/users?search=admin", nil, token)

	if resp.StatusCode != 200 {
		t.Errorf("Search users status = %d, want 200", resp.StatusCode)
	}
}

// ======================================
// Role Tests
// ======================================

func TestRoles_GetAll(t *testing.T) {
	checkServerAvailable(t)

	resp, respBody := makeRequest(t, "GET", "/roles", nil, "")

	if resp.StatusCode != 200 {
		t.Errorf("GetAll roles status = %d, want 200", resp.StatusCode)
	}

	var apiResp APIResponse
	json.Unmarshal(respBody, &apiResp)

	var roles []map[string]interface{}
	json.Unmarshal(apiResp.Data, &roles)

	// Should have at least admin, teacher, visitor
	if len(roles) < 3 {
		t.Errorf("Expected at least 3 roles, got %d", len(roles))
	}
}

func TestRoles_GetByID_NotFound(t *testing.T) {
	checkServerAvailable(t)
	token := getAdminToken(t)

	resp, _ := makeRequest(t, "GET", "/roles/99999", nil, token)

	if resp.StatusCode != 404 {
		t.Errorf("GetByID non-existent role status = %d, want 404", resp.StatusCode)
	}
}

// ======================================
// Schedule Tests
// ======================================

func TestSchedules_GetAll(t *testing.T) {
	checkServerAvailable(t)

	resp, _ := makeRequest(t, "GET", "/schedules", nil, "")

	if resp.StatusCode != 200 {
		t.Errorf("GetAll schedules status = %d, want 200", resp.StatusCode)
	}
}

func TestSchedules_GetByID_NotFound(t *testing.T) {
	checkServerAvailable(t)

	resp, _ := makeRequest(t, "GET", "/schedules/99999", nil, "")

	if resp.StatusCode != 404 {
		t.Errorf("GetByID non-existent schedule status = %d, want 404", resp.StatusCode)
	}
}

func TestSchedules_CreateWithoutAuth(t *testing.T) {
	checkServerAvailable(t)

	body := map[string]interface{}{
		"room_id":      1,
		"subject":      "Test Subject",
		"day_of_week":  1,
		"start_time":   "09:00",
		"end_time":     "10:00",
	}

	resp, _ := makeRequest(t, "POST", "/schedules", body, "")

	if resp.StatusCode != 401 {
		t.Errorf("Create schedule without auth status = %d, want 401", resp.StatusCode)
	}
}

func TestSchedules_GetByRoomID(t *testing.T) {
	checkServerAvailable(t)

	// Get first room
	_, roomsBody := makeRequest(t, "GET", "/rooms", nil, "")
	var roomsResp APIResponse
	json.Unmarshal(roomsBody, &roomsResp)

	var rooms []map[string]interface{}
	json.Unmarshal(roomsResp.Data, &rooms)
	if len(rooms) == 0 {
		t.Skip("No rooms to test schedules by room ID")
	}

	roomID := int(rooms[0]["room_id"].(float64))
	resp, _ := makeRequest(t, "GET", fmt.Sprintf("/rooms/%d/schedules", roomID), nil, "")

	if resp.StatusCode != 200 {
		t.Errorf("GetByRoomID schedules status = %d, want 200", resp.StatusCode)
	}
}

// ======================================
// Security Tests
// ======================================

func TestSecurity_SQLInjection_Login(t *testing.T) {
	checkServerAvailable(t)

	body := map[string]string{
		"email":    "admin@silpakorn.edu' OR '1'='1",
		"password": "' OR '1'='1",
	}

	resp, _ := makeRequest(t, "POST", "/auth/login", body, "")

	// Should not succeed with SQL injection
	if resp.StatusCode == 200 {
		t.Error("SQL injection attempt on login should not succeed")
	}
}

func TestSecurity_SQLInjection_Search(t *testing.T) {
	checkServerAvailable(t)
	token := getAdminToken(t)

	resp, _ := makeRequest(t, "GET", "/users?search='+OR+1=1--", nil, token)

	// Should return 200 but with no unauthorized data leaked
	if resp.StatusCode == 500 {
		t.Error("SQL injection on search caused server error")
	}
}

func TestSecurity_XSS_BuildingName(t *testing.T) {
	checkServerAvailable(t)
	token := getAdminToken(t)

	body := map[string]string{
		"name":        "<script>alert('xss')</script>",
		"description": "<img onerror=\"alert('xss')\" src=x>",
	}

	resp, respBody := makeRequest(t, "POST", "/buildings", body, token)

	// The server should accept it (XSS prevention is frontend responsibility)
	// but the data should be stored as-is (not executed)
	if resp.StatusCode == 201 {
		// Clean up
		var apiResp APIResponse
		json.Unmarshal(respBody, &apiResp)
		var building map[string]interface{}
		json.Unmarshal(apiResp.Data, &building)
		buildingID := int(building["building_id"].(float64))
		makeRequest(t, "DELETE", fmt.Sprintf("/buildings/%d", buildingID), nil, token)
	}
	// Test passes as long as server doesn't crash
}

func TestSecurity_InvalidAuthHeaderFormat(t *testing.T) {
	checkServerAvailable(t)

	req, _ := http.NewRequest("GET", baseURL+"/auth/me", nil)
	req.Header.Set("Authorization", "Basic dGVzdDp0ZXN0") // Basic auth instead of Bearer

	client := &http.Client{Timeout: 5 * time.Second}
	resp, _ := client.Do(req)
	resp.Body.Close()

	if resp.StatusCode != 401 {
		t.Errorf("Invalid auth header format status = %d, want 401", resp.StatusCode)
	}
}

func TestSecurity_LargePayload(t *testing.T) {
	checkServerAvailable(t)
	token := getAdminToken(t)

	// Create a very large title (exceeds varchar(255) limit)
	largeTitle := ""
	for i := 0; i < 1000; i++ {
		largeTitle += "A"
	}

	body := map[string]interface{}{
		"room_id":      1,
		"title":        largeTitle,
		"booking_date": "2026-12-25",
		"start_time":   "09:00",
		"end_time":     "10:00",
	}

	resp, _ := makeRequest(t, "POST", "/bookings", body, token)

	// Should either reject (400) or handle gracefully (not 500)
	if resp.StatusCode == 500 {
		t.Error("Large payload caused server error (should be handled gracefully)")
	}
}

func TestSecurity_CORSHeaders(t *testing.T) {
	checkServerAvailable(t)

	req, _ := http.NewRequest("OPTIONS", baseURL+"/health", nil)
	req.Header.Set("Origin", "http://evil.com")
	req.Header.Set("Access-Control-Request-Method", "GET")

	client := &http.Client{Timeout: 5 * time.Second}
	resp, _ := client.Do(req)
	resp.Body.Close()

	// CORS is set to AllowOrigins: "*" which is permissive
	allowOrigin := resp.Header.Get("Access-Control-Allow-Origin")
	if allowOrigin == "*" {
		// This is a finding - CORS allows all origins
		t.Log("WARNING: CORS allows all origins (*) - should be restricted in production")
	}
}

// ======================================
// Room Availability Tests
// ======================================

func TestRoomAvailability_GetAvailability(t *testing.T) {
	checkServerAvailable(t)

	// Get first room
	_, roomsBody := makeRequest(t, "GET", "/rooms", nil, "")
	var roomsResp APIResponse
	json.Unmarshal(roomsBody, &roomsResp)

	var rooms []map[string]interface{}
	json.Unmarshal(roomsResp.Data, &rooms)
	if len(rooms) == 0 {
		t.Skip("No rooms to test availability")
	}

	roomID := int(rooms[0]["room_id"].(float64))
	resp, _ := makeRequest(t, "GET", fmt.Sprintf("/rooms/%d/availability?date=2026-04-01", roomID), nil, "")

	if resp.StatusCode != 200 {
		t.Errorf("GetAvailability status = %d, want 200", resp.StatusCode)
	}
}

// ======================================
// Notification Tests
// ======================================

func TestNotifications_GetMyWithoutAuth(t *testing.T) {
	checkServerAvailable(t)

	resp, _ := makeRequest(t, "GET", "/notifications/my", nil, "")

	if resp.StatusCode != 401 {
		t.Errorf("GetMyNotifications without auth status = %d, want 401", resp.StatusCode)
	}
}

func TestNotifications_GetMyWithAuth(t *testing.T) {
	checkServerAvailable(t)
	token := getAdminToken(t)

	resp, _ := makeRequest(t, "GET", "/notifications/my", nil, token)

	if resp.StatusCode != 200 {
		t.Errorf("GetMyNotifications with auth status = %d, want 200", resp.StatusCode)
	}
}

func TestNotifications_MarkAllAsRead(t *testing.T) {
	checkServerAvailable(t)
	token := getAdminToken(t)

	resp, _ := makeRequest(t, "PATCH", "/notifications/read-all", nil, token)

	if resp.StatusCode != 200 {
		t.Errorf("MarkAllAsRead status = %d, want 200", resp.StatusCode)
	}
}
