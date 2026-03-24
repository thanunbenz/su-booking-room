package utils

import (
	"os"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func setupJWTSecret(t *testing.T) {
	t.Helper()
	os.Setenv("JWT_SECRET", "test-secret-key-for-testing")
}

func TestGenerateToken(t *testing.T) {
	setupJWTSecret(t)

	tests := []struct {
		name     string
		userID   uint
		roleID   uint
		fullName string
		wantErr  bool
	}{
		{"admin user", 1, 1, "Admin User", false},
		{"teacher user", 2, 2, "Teacher User", false},
		{"visitor user", 3, 3, "Visitor User", false},
		{"zero IDs", 0, 0, "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			token, err := GenerateToken(tt.userID, tt.roleID, tt.fullName)
			if (err != nil) != tt.wantErr {
				t.Errorf("GenerateToken() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && token == "" {
				t.Error("GenerateToken() returned empty token")
			}
		})
	}
}

func TestGenerateRefreshToken(t *testing.T) {
	setupJWTSecret(t)

	token, err := GenerateRefreshToken(1, 1, "Admin User")
	if err != nil {
		t.Fatalf("GenerateRefreshToken() error = %v", err)
	}
	if token == "" {
		t.Error("GenerateRefreshToken() returned empty token")
	}
}

func TestExtractClaims(t *testing.T) {
	setupJWTSecret(t)

	// Generate a valid token
	token, err := GenerateToken(42, 2, "Test User")
	if err != nil {
		t.Fatalf("GenerateToken() error = %v", err)
	}

	// Extract claims
	claims, err := ExtractClaims(token)
	if err != nil {
		t.Fatalf("ExtractClaims() error = %v", err)
	}

	if claims.UserID != 42 {
		t.Errorf("ExtractClaims() UserID = %v, want 42", claims.UserID)
	}
	if claims.RoleID != 2 {
		t.Errorf("ExtractClaims() RoleID = %v, want 2", claims.RoleID)
	}
	if claims.FullName != "Test User" {
		t.Errorf("ExtractClaims() FullName = %v, want 'Test User'", claims.FullName)
	}
}

func TestExtractClaims_InvalidToken(t *testing.T) {
	setupJWTSecret(t)

	tests := []struct {
		name  string
		token string
	}{
		{"empty token", ""},
		{"garbage token", "not.a.valid.token"},
		{"malformed token", "eyJhbGciOiJIUzI1NiJ9.invalid.invalid"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := ExtractClaims(tt.token)
			if err == nil {
				t.Error("ExtractClaims() expected error for invalid token, got nil")
			}
		})
	}
}

func TestExtractClaims_ExpiredToken(t *testing.T) {
	setupJWTSecret(t)

	// Create an expired token manually
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":    float64(1),
		"role_id":    float64(1),
		"full_name":  "Expired User",
		"token_type": "access",
		"exp":        jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)), // expired 1 hour ago
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		t.Fatalf("Failed to create test token: %v", err)
	}

	_, err = ExtractClaims(tokenString)
	if err == nil {
		t.Error("ExtractClaims() should return error for expired token")
	}
}

func TestExtractClaims_WrongSigningMethod(t *testing.T) {
	setupJWTSecret(t)

	// Create a token with wrong signing method (none)
	token := jwt.NewWithClaims(jwt.SigningMethodNone, jwt.MapClaims{
		"user_id":   float64(1),
		"role_id":   float64(1),
		"full_name": "Hacker",
		"exp":       jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
	})

	tokenString, _ := token.SignedString(jwt.UnsafeAllowNoneSignatureType)

	_, err := ExtractClaims(tokenString)
	if err == nil {
		t.Error("ExtractClaims() should reject tokens with 'none' signing method")
	}
}

func TestVerifyToken(t *testing.T) {
	setupJWTSecret(t)

	// Valid token
	validToken, _ := GenerateToken(1, 1, "Test")
	valid, err := VerifyToken(validToken)
	if err != nil {
		t.Errorf("VerifyToken() error = %v for valid token", err)
	}
	if !valid {
		t.Error("VerifyToken() returned false for valid token")
	}

	// Invalid token
	_, err = VerifyToken("invalid-token")
	if err == nil {
		t.Error("VerifyToken() should return error for invalid token")
	}
}

func TestValidateRefreshToken(t *testing.T) {
	setupJWTSecret(t)

	// Generate refresh token
	refreshToken, err := GenerateRefreshToken(42, 2, "Test User")
	if err != nil {
		t.Fatalf("GenerateRefreshToken() error = %v", err)
	}

	// Validate it
	userID, err := ValidateRefreshToken(refreshToken)
	if err != nil {
		t.Errorf("ValidateRefreshToken() error = %v", err)
	}
	if userID != 42 {
		t.Errorf("ValidateRefreshToken() userID = %v, want 42", userID)
	}

	// Access token should fail validation as refresh token
	accessToken, _ := GenerateToken(1, 1, "Test")
	_, err = ValidateRefreshToken(accessToken)
	if err == nil {
		t.Error("ValidateRefreshToken() should reject access tokens")
	}
}

func TestExtractUserID(t *testing.T) {
	setupJWTSecret(t)

	token, _ := GenerateToken(99, 1, "Test")
	userID, err := ExtractUserID(token)
	if err != nil {
		t.Errorf("ExtractUserID() error = %v", err)
	}
	if userID != 99 {
		t.Errorf("ExtractUserID() = %v, want 99", userID)
	}
}

func TestExtractRoleID(t *testing.T) {
	setupJWTSecret(t)

	token, _ := GenerateToken(1, 3, "Test")
	roleID, err := ExtractRoleID(token)
	if err != nil {
		t.Errorf("ExtractRoleID() error = %v", err)
	}
	if roleID != 3 {
		t.Errorf("ExtractRoleID() = %v, want 3", roleID)
	}
}

func TestGenerateToken_EmptySecret(t *testing.T) {
	os.Setenv("JWT_SECRET", "")

	// Should still generate a token (empty secret is technically valid for HMAC)
	token, err := GenerateToken(1, 1, "Test")
	if err != nil {
		t.Errorf("GenerateToken() with empty secret error = %v", err)
	}
	if token == "" {
		t.Error("GenerateToken() with empty secret returned empty token")
	}

	// Restore
	setupJWTSecret(t)
}

func TestTokensAreDifferent(t *testing.T) {
	setupJWTSecret(t)

	accessToken, _ := GenerateToken(1, 1, "Test")
	refreshToken, _ := GenerateRefreshToken(1, 1, "Test")

	if accessToken == refreshToken {
		t.Error("Access token and refresh token should be different")
	}
}
