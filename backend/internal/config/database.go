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
	// Migrate ตามลำดับ: parent tables ก่อน
	if err := DB.AutoMigrate(&models.Role{}); err != nil {
		return err
	}

	if err := DB.AutoMigrate(&models.User{}); err != nil {
		return err
	}

	if err := DB.AutoMigrate(&models.Building{}); err != nil {
		return err
	}

	if err := DB.AutoMigrate(&models.Room{}); err != nil {
		return err
	}

	if err := DB.AutoMigrate(&models.FixedSchedule{}); err != nil {
		return err
	}

	// Manual migration for Booking.EndDate (multi-day support):
	// AutoMigrate cannot add a NOT NULL column to an existing table that has
	// rows. We add the column nullable, backfill from booking_date, then
	// enforce NOT NULL — all inside a block guarded by column existence so
	// it is idempotent across restarts.
	if err := DB.Exec(`DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE bookings ADD COLUMN end_date DATE;
    UPDATE bookings SET end_date = booking_date WHERE end_date IS NULL;
    ALTER TABLE bookings ALTER COLUMN end_date SET NOT NULL;
  END IF;
END $$;`).Error; err != nil {
		return fmt.Errorf("backfill end_date: %w", err)
	}

	if err := DB.AutoMigrate(&models.Booking{}); err != nil {
		return err
	}

	if err := DB.AutoMigrate(&models.Notification{}); err != nil {
		return err
	}

	return nil
}
