package utils

import (
	"testing"
)

func init() {
	InitValidator()
}

func TestValidateStruct_LoginRequest(t *testing.T) {
	type LoginRequest struct {
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required,min=6"`
	}

	tests := []struct {
		name     string
		input    LoginRequest
		wantErr  bool
		errCount int
	}{
		{"valid login", LoginRequest{Email: "test@example.com", Password: "password123"}, false, 0},
		{"missing email", LoginRequest{Email: "", Password: "password123"}, true, 1},
		{"missing password", LoginRequest{Email: "test@example.com", Password: ""}, true, 1},
		{"missing both", LoginRequest{Email: "", Password: ""}, true, 2},
		{"invalid email", LoginRequest{Email: "not-an-email", Password: "password123"}, true, 1},
		{"short password", LoginRequest{Email: "test@example.com", Password: "123"}, true, 1},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errors := ValidateStruct(tt.input)
			if tt.wantErr && errors == nil {
				t.Error("ValidateStruct() expected errors, got nil")
			}
			if !tt.wantErr && errors != nil {
				t.Errorf("ValidateStruct() expected no errors, got %v", errors)
			}
			if tt.wantErr && errors != nil && len(errors) != tt.errCount {
				t.Errorf("ValidateStruct() error count = %d, want %d", len(errors), tt.errCount)
			}
		})
	}
}

func TestValidateStruct_RegisterRequest(t *testing.T) {
	type RegisterRequest struct {
		Email    string `json:"email" validate:"required,email_silpakorn"`
		Password string `json:"password" validate:"required,min=6"`
		Fullname string `json:"fullname" validate:"required,min=3"`
		Username string `json:"username" validate:"required,min=3"`
	}

	tests := []struct {
		name    string
		input   RegisterRequest
		wantErr bool
	}{
		{
			"valid registration",
			RegisterRequest{
				Email:    "test@silpakorn.edu",
				Password: "password123",
				Fullname: "Test User",
				Username: "testuser",
			},
			false,
		},
		{
			"non-silpakorn email",
			RegisterRequest{
				Email:    "test@gmail.com",
				Password: "password123",
				Fullname: "Test User",
				Username: "testuser",
			},
			true,
		},
		{
			"short username",
			RegisterRequest{
				Email:    "test@silpakorn.edu",
				Password: "password123",
				Fullname: "Test User",
				Username: "ab",
			},
			true,
		},
		{
			"short fullname",
			RegisterRequest{
				Email:    "test@silpakorn.edu",
				Password: "password123",
				Fullname: "AB",
				Username: "testuser",
			},
			true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errors := ValidateStruct(tt.input)
			if tt.wantErr && errors == nil {
				t.Error("ValidateStruct() expected errors, got nil")
			}
			if !tt.wantErr && errors != nil {
				t.Errorf("ValidateStruct() expected no errors, got %v", errors)
			}
		})
	}
}

func TestIsValidEmail(t *testing.T) {
	tests := []struct {
		name  string
		email string
		want  bool
	}{
		{"valid email", "test@example.com", true},
		{"valid silpakorn email", "admin@silpakorn.edu", true},
		{"no @ sign", "notanemail", false},
		{"no domain", "test@", false},
		{"no local part", "@example.com", false},
		{"empty", "", false},
		{"with spaces", "test @example.com", false},
		{"multiple @", "test@@example.com", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsValidEmail(tt.email); got != tt.want {
				t.Errorf("IsValidEmail(%q) = %v, want %v", tt.email, got, tt.want)
			}
		})
	}
}

func TestIsValidTimeRange(t *testing.T) {
	tests := []struct {
		name      string
		startTime string
		endTime   string
		want      bool
	}{
		{"valid range", "09:00:00", "12:00:00", true},
		{"same time", "09:00:00", "09:00:00", false},
		{"end before start", "12:00:00", "09:00:00", false},
		{"invalid start format", "9am", "12:00:00", false},
		{"invalid end format", "09:00:00", "noon", false},
		{"both invalid", "abc", "def", false},
		{"minute precision", "09:30:00", "09:31:00", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsValidTimeRange(tt.startTime, tt.endTime); got != tt.want {
				t.Errorf("IsValidTimeRange(%q, %q) = %v, want %v", tt.startTime, tt.endTime, got, tt.want)
			}
		})
	}
}

func TestIsValidDateRange(t *testing.T) {
	tests := []struct {
		name      string
		startDate string
		endDate   string
		want      bool
	}{
		{"valid range", "2026-01-01", "2026-12-31", true},
		{"same date", "2026-01-01", "2026-01-01", true},
		{"end before start", "2026-12-31", "2026-01-01", false},
		{"invalid start", "not-a-date", "2026-01-01", false},
		{"invalid end", "2026-01-01", "not-a-date", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsValidDateRange(tt.startDate, tt.endDate); got != tt.want {
				t.Errorf("IsValidDateRange(%q, %q) = %v, want %v", tt.startDate, tt.endDate, got, tt.want)
			}
		})
	}
}

func TestIsValidDayOfWeek(t *testing.T) {
	tests := []struct {
		name string
		day  int
		want bool
	}{
		{"monday", 1, true},
		{"sunday", 7, true},
		{"wednesday", 3, true},
		{"zero", 0, false},
		{"negative", -1, false},
		{"eight", 8, false},
		{"hundred", 100, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsValidDayOfWeek(tt.day); got != tt.want {
				t.Errorf("IsValidDayOfWeek(%d) = %v, want %v", tt.day, got, tt.want)
			}
		})
	}
}

func TestValidateStruct_NilValidator(t *testing.T) {
	// Test that ValidateStruct initializes validator if nil
	originalValidator := Validate
	Validate = nil

	type SimpleStruct struct {
		Name string `validate:"required"`
	}

	errors := ValidateStruct(SimpleStruct{Name: "test"})
	if errors != nil {
		t.Errorf("ValidateStruct() with auto-init should not error for valid struct, got %v", errors)
	}

	// Restore
	Validate = originalValidator
}
