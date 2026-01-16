package utils

import (
	"regexp"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
)

// Validator instance
var Validate *validator.Validate

// InitValidator สร้าง validator instance
func InitValidator() {
	Validate = validator.New()

	// ลงทะเบียน custom validators
	Validate.RegisterValidation("email_silpakorn", validateSilpakornEmail)
	Validate.RegisterValidation("time_format", validateTimeFormat)
	Validate.RegisterValidation("date_format", validateDateFormat)
	Validate.RegisterValidation("datetime_format", validateDateTimeFormat)
	Validate.RegisterValidation("future_date", validateFutureDate)
}

// validateSilpakornEmail ตรวจสอบว่าเป็น email ของ Silpakorn หรือไม่
func validateSilpakornEmail(fl validator.FieldLevel) bool {
	email := fl.Field().String()
	// ตรวจสอบว่าเป็น email ปกติก่อน
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(email) {
		return false
	}
	// ตรวจสอบว่าเป็น @silpakorn.edu หรือไม่
	return strings.HasSuffix(email, "@silpakorn.edu")
}

// validateTimeFormat ตรวจสอบรูปแบบเวลา HH:MM:SS
func validateTimeFormat(fl validator.FieldLevel) bool {
	timeStr := fl.Field().String()
	_, err := time.Parse("15:04:05", timeStr)
	return err == nil
}

// validateDateFormat ตรวจสอบรูปแบบวันที่ YYYY-MM-DD
func validateDateFormat(fl validator.FieldLevel) bool {
	dateStr := fl.Field().String()
	_, err := time.Parse("2006-01-02", dateStr)
	return err == nil
}

// validateDateTimeFormat ตรวจสอบรูปแบบวันที่และเวลา YYYY-MM-DD HH:MM:SS
func validateDateTimeFormat(fl validator.FieldLevel) bool {
	dateTimeStr := fl.Field().String()
	_, err := time.Parse("2006-01-02 15:04:05", dateTimeStr)
	return err == nil
}

// validateFutureDate ตรวจสอบว่าวันที่เป็นอนาคตหรือไม่
func validateFutureDate(fl validator.FieldLevel) bool {
	dateStr := fl.Field().String()
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return false
	}
	return date.After(time.Now())
}

// ValidateStruct ตรวจสอบ struct และคืนค่า error details
func ValidateStruct(s interface{}) []ErrorDetail {
	if Validate == nil {
		InitValidator()
	}

	err := Validate.Struct(s)
	if err == nil {
		return nil
	}

	var errors []ErrorDetail
	for _, err := range err.(validator.ValidationErrors) {
		errors = append(errors, ErrorDetail{
			Field:   strings.ToLower(err.Field()),
			Message: getErrorMessage(err),
		})
	}

	return errors
}

// getErrorMessage แปลง validation error เป็นข้อความที่อ่านง่าย
func getErrorMessage(err validator.FieldError) string {
	field := err.Field()
	tag := err.Tag()

	switch tag {
	case "required":
		return field + " is required"
	case "email":
		return field + " must be a valid email address"
	case "email_silpakorn":
		return field + " must be a valid Silpakorn email (@silpakorn.edu)"
	case "min":
		return field + " must be at least " + err.Param() + " characters"
	case "max":
		return field + " must be at most " + err.Param() + " characters"
	case "gte":
		return field + " must be greater than or equal to " + err.Param()
	case "lte":
		return field + " must be less than or equal to " + err.Param()
	case "gt":
		return field + " must be greater than " + err.Param()
	case "lt":
		return field + " must be less than " + err.Param()
	case "time_format":
		return field + " must be in HH:MM:SS format"
	case "date_format":
		return field + " must be in YYYY-MM-DD format"
	case "datetime_format":
		return field + " must be in YYYY-MM-DD HH:MM:SS format"
	case "future_date":
		return field + " must be a future date"
	default:
		return field + " is invalid"
	}
}

// IsValidEmail ตรวจสอบว่าเป็น email ที่ถูกต้องหรือไม่
func IsValidEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}

// IsValidTimeRange ตรวจสอบว่า start time < end time หรือไม่
func IsValidTimeRange(startTime, endTime string) bool {
	start, err1 := time.Parse("15:04:05", startTime)
	end, err2 := time.Parse("15:04:05", endTime)

	if err1 != nil || err2 != nil {
		return false
	}

	return start.Before(end)
}

// IsValidDateRange ตรวจสอบว่า start date <= end date หรือไม่
func IsValidDateRange(startDate, endDate string) bool {
	start, err1 := time.Parse("2006-01-02", startDate)
	end, err2 := time.Parse("2006-01-02", endDate)

	if err1 != nil || err2 != nil {
		return false
	}

	return start.Before(end) || start.Equal(end)
}

// IsValidDayOfWeek ตรวจสอบว่า day of week อยู่ระหว่าง 1-7 หรือไม่
func IsValidDayOfWeek(day int) bool {
	return day >= 1 && day <= 7
}
