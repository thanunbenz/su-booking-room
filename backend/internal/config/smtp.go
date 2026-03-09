package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// SMTPConfig - SMTP configuration structure
type SMTPConfig struct {
	Host        string
	Port        int
	Username    string
	Password    string
	From        string
	Enabled     bool
	QueueSize   int
	WorkerCount int
	RetryCount  int
	RetryDelay  time.Duration
}

// Helper functions สำหรับ SMTP config (ประกาศก่อน LoadSMTPConfig)
func getEnvStr(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}
	value, err := strconv.Atoi(valueStr)
	if err != nil {
		return defaultValue
	}
	return value
}

func getEnvAsBool(key string, defaultValue bool) bool {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}
	value, err := strconv.ParseBool(valueStr)
	if err != nil {
		return defaultValue
	}
	return value
}

func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}
	value, err := time.ParseDuration(valueStr)
	if err != nil {
		return defaultValue
	}
	return value
}

// LoadSMTPConfig - โหลด SMTP configuration จาก environment variables
func LoadSMTPConfig() *SMTPConfig {
	enabled := getEnvAsBool("SMTP_ENABLED", true)
	port := getEnvAsInt("SMTP_PORT", 587)
	queueSize := getEnvAsInt("EMAIL_QUEUE_SIZE", 100)
	workerCount := getEnvAsInt("EMAIL_WORKER_COUNT", 3)
	retryCount := getEnvAsInt("EMAIL_RETRY_COUNT", 3)
	retryDelay := getEnvAsDuration("EMAIL_RETRY_DELAY", 5*time.Second)

	config := &SMTPConfig{
		Host:        getEnvStr("SMTP_HOST", "smtp.gmail.com"),
		Port:        port,
		Username:    getEnvStr("SMTP_USERNAME", ""),
		Password:    getEnvStr("SMTP_PASSWORD", ""),
		From:        getEnvStr("SMTP_FROM", "SU Booking Room <noreply@silpakorn.edu>"),
		Enabled:     enabled,
		QueueSize:   queueSize,
		WorkerCount: workerCount,
		RetryCount:  retryCount,
		RetryDelay:  retryDelay,
	}

	// Validate critical fields (only Host is required, Username/Password optional for MailHog)
	if config.Enabled && config.Host == "" {
		fmt.Println("⚠️  WARNING: SMTP is enabled but Host is missing. Email notifications will be disabled.")
		config.Enabled = false
	}

	if config.Enabled {
		fmt.Printf("✅ SMTP Config loaded: %s:%d (Workers: %d, Queue: %d)\n",
			config.Host, config.Port, config.WorkerCount, config.QueueSize)
	} else {
		fmt.Println("📧 Email notifications are DISABLED")
	}

	return config
}
