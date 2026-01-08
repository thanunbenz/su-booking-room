package config

import (
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/thanunbenz/su-booking-room/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

var (
	host     = getEnv("DB_HOST", "localhost")
	port     = getEnvInt("DB_PORT", 5432)
	user     = getEnv("DB_USER", "sumbenz")
	password = getEnv("DB_PASSWORD", "sumbenz2806")
	dbname   = getEnv("DB_NAME", "su_booking_room")
)

var DB *gorm.DB

func ConnectDB() {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%d sslmode=disable",
		host, user, password, dbname, port)
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	fmt.Println("Successfully connected to database with GORM!")

	// Run Auto Migration
	if err := AutoMigrate(); err != nil {
		log.Fatal("Failed to run auto migration:", err)
	}
}

// AutoMigrate runs database migrations for all models
func AutoMigrate() error {
	return DB.AutoMigrate(
		&models.Role{},
		&models.User{},
		&models.Building{},
		&models.Room{},
		&models.Booking{},
		&models.FixedSchedule{},
		&models.Notification{},
	)
}
