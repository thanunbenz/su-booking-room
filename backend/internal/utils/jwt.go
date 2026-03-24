package utils

import (
	"errors"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret []byte

func init() {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Fatal("Required environment variable JWT_SECRET is not set")
	}
	if len(secret) < 32 {
		log.Fatal("JWT_SECRET must be at least 32 characters long")
	}
	jwtSecret = []byte(secret)
}

func GenerateToken(UserID uint, roleID uint, fullName string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":    UserID,
		"role_id":    roleID,
		"full_name":  fullName,
		"token_type": "access",
		"exp":        jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
	})

	t, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", err
	}

	return t, nil
}

func GenerateRefreshToken(UserID uint, roleID uint, fullName string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":    UserID,
		"role_id":    roleID,
		"full_name":  fullName,
		"token_type": "refresh",
		"exp":        jwt.NewNumericDate(time.Now().Add(168 * time.Hour)), // 7 days
	})

	t, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", err
	}

	return t, nil
}

func ValidateRefreshToken(tokenString string) (uint, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil {
		return 0, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		tokenType, ok := claims["token_type"].(string)
		if !ok || tokenType != "refresh" {
			return 0, errors.New("invalid token type")
		}

		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			return 0, errors.New("invalid user_id in token")
		}
		return uint(userIDFloat), nil
	}

	return 0, errors.New("invalid token")
}

// JWTClaims โครงสร้างข้อมูลที่เก็บใน JWT
type JWTClaims struct {
	UserID   uint
	RoleID   uint
	FullName string
}

// VerifyToken ตรวจสอบความถูกต้องของ token
func VerifyToken(tokenString string) (bool, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// ตรวจสอบ signing method เพื่อป้องกัน algorithm confusion attack
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return jwtSecret, nil
	})
	if err != nil {
		return false, err
	}

	return token.Valid, nil
}

// ExtractClaims ดึงข้อมูล user_id และ role_id จาก token
func ExtractClaims(tokenString string) (*JWTClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// ตรวจสอบ signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			return nil, errors.New("invalid user_id in token")
		}

		roleIDFloat, ok := claims["role_id"].(float64)
		if !ok {
			return nil, errors.New("invalid role_id in token")
		}

		FullName, ok := claims["full_name"].(string)
		if !ok {
			return nil, errors.New("invalid full_name in token")
		}

		return &JWTClaims{
			UserID:   uint(userIDFloat),
			RoleID:   uint(roleIDFloat),
			FullName: FullName,
		}, nil
	}

	return nil, errors.New("invalid token claims")
}

// ExtractUserID ดึงเฉพาะ user_id จาก token
func ExtractUserID(tokenString string) (uint, error) {
	claims, err := ExtractClaims(tokenString)
	if err != nil {
		return 0, err
	}
	return claims.UserID, nil
}

// ExtractRoleID ดึงเฉพาะ role_id จาก token
func ExtractRoleID(tokenString string) (uint, error) {
	claims, err := ExtractClaims(tokenString)
	if err != nil {
		return 0, err
	}
	return claims.RoleID, nil
}
