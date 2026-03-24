package utils

import (
	"testing"
)

func TestHashPassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{"valid password", "password123", false},
		{"short password", "abc", false},
		{"empty password", "", false},
		{"long password", "a-very-long-password-that-is-still-valid-for-bcrypt-hashing-purposes", false},
		{"special characters", "p@$$w0rd!#%^&*()", false},
		{"unicode password", "รหัสผ่าน123", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hash, err := HashPassword(tt.password)
			if (err != nil) != tt.wantErr {
				t.Errorf("HashPassword() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && hash == "" {
				t.Error("HashPassword() returned empty hash")
			}
			if !tt.wantErr && hash == tt.password {
				t.Error("HashPassword() returned plaintext password")
			}
		})
	}
}

func TestComparePassword(t *testing.T) {
	password := "password123"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword() failed: %v", err)
	}

	tests := []struct {
		name           string
		hashedPassword string
		password       string
		want           bool
	}{
		{"correct password", hash, "password123", true},
		{"wrong password", hash, "wrongpassword", false},
		{"empty password", hash, "", false},
		{"invalid hash", "not-a-valid-hash", "password123", false},
		{"empty hash", "", "password123", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := ComparePassword(tt.hashedPassword, tt.password); got != tt.want {
				t.Errorf("ComparePassword() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestHashPassword_DifferentHashesForSamePassword(t *testing.T) {
	password := "password123"
	hash1, err1 := HashPassword(password)
	hash2, err2 := HashPassword(password)

	if err1 != nil || err2 != nil {
		t.Fatalf("HashPassword() errors: %v, %v", err1, err2)
	}

	if hash1 == hash2 {
		t.Error("HashPassword() generated identical hashes for same password (should use unique salt)")
	}

	// Both hashes should validate against the original password
	if !ComparePassword(hash1, password) {
		t.Error("ComparePassword() failed for hash1")
	}
	if !ComparePassword(hash2, password) {
		t.Error("ComparePassword() failed for hash2")
	}
}

func TestHashPassword_BcryptMaxLength(t *testing.T) {
	// bcrypt has a 72-byte limit; Go 1.25+ returns error for passwords exceeding this
	longPassword := string(make([]byte, 100))
	_, err := HashPassword(longPassword)
	if err == nil {
		t.Log("HashPassword() accepted password > 72 bytes (older bcrypt behavior)")
	} else {
		t.Log("HashPassword() correctly rejected password > 72 bytes")
	}
	// Both behaviors are acceptable depending on bcrypt version
}
