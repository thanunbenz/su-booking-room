package models

import (
	"encoding/json"
	"testing"
	"time"
)

func TestCustomDate_UnmarshalJSON(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantErr bool
		isZero  bool
	}{
		{"valid date", `"2026-03-24"`, false, false},
		{"null value", `null`, false, true},
		{"empty string", `""`, false, true},
		{"invalid date", `"not-a-date"`, true, false},
		{"wrong format", `"24-03-2026"`, true, false},
		{"with time", `"2026-03-24T10:00:00Z"`, true, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var cd CustomDate
			err := cd.UnmarshalJSON([]byte(tt.input))
			if (err != nil) != tt.wantErr {
				t.Errorf("CustomDate.UnmarshalJSON() error = %v, wantErr %v", err, tt.wantErr)
			}
			if !tt.wantErr && tt.isZero && !cd.IsZero() {
				t.Error("CustomDate should be zero for null/empty input")
			}
			if !tt.wantErr && !tt.isZero && cd.IsZero() {
				t.Error("CustomDate should not be zero for valid date")
			}
		})
	}
}

func TestCustomDate_MarshalJSON(t *testing.T) {
	tests := []struct {
		name string
		date CustomDate
		want string
	}{
		{
			"valid date",
			CustomDate{Time: time.Date(2026, 3, 24, 0, 0, 0, 0, time.UTC)},
			`"2026-03-24"`,
		},
		{
			"zero date",
			CustomDate{},
			`null`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := tt.date.MarshalJSON()
			if err != nil {
				t.Errorf("CustomDate.MarshalJSON() error = %v", err)
				return
			}
			if string(got) != tt.want {
				t.Errorf("CustomDate.MarshalJSON() = %s, want %s", string(got), tt.want)
			}
		})
	}
}

func TestCustomDate_Value(t *testing.T) {
	// Non-zero date
	cd := CustomDate{Time: time.Date(2026, 3, 24, 0, 0, 0, 0, time.UTC)}
	val, err := cd.Value()
	if err != nil {
		t.Errorf("CustomDate.Value() error = %v", err)
	}
	if val != "2026-03-24" {
		t.Errorf("CustomDate.Value() = %v, want '2026-03-24'", val)
	}

	// Zero date
	cd = CustomDate{}
	val, err = cd.Value()
	if err != nil {
		t.Errorf("CustomDate.Value() error = %v for zero date", err)
	}
	if val != nil {
		t.Errorf("CustomDate.Value() = %v, want nil for zero date", val)
	}
}

func TestCustomDate_Scan(t *testing.T) {
	tests := []struct {
		name    string
		input   interface{}
		want    string
		wantErr bool
	}{
		{"nil value", nil, "", false},
		{"time value", time.Date(2026, 3, 24, 0, 0, 0, 0, time.UTC), "2026-03-24", false},
		{"string value", "2026-03-24", "2026-03-24", false},
		{"bytes value", []byte("2026-03-24"), "2026-03-24", false},
		{"invalid string", "not-a-date", "", true},
		{"invalid type", 12345, "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var cd CustomDate
			err := cd.Scan(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("CustomDate.Scan() error = %v, wantErr %v", err, tt.wantErr)
			}
			if !tt.wantErr && tt.want != "" {
				got := cd.Time.Format("2006-01-02")
				if got != tt.want {
					t.Errorf("CustomDate.Scan() = %v, want %v", got, tt.want)
				}
			}
		})
	}
}

func TestBooking_TableName(t *testing.T) {
	b := Booking{}
	if b.TableName() != "bookings" {
		t.Errorf("Booking.TableName() = %q, want 'bookings'", b.TableName())
	}
}

func TestCustomDate_RoundTrip(t *testing.T) {
	// Test that marshal -> unmarshal preserves the date
	original := CustomDate{Time: time.Date(2026, 6, 15, 0, 0, 0, 0, time.UTC)}

	data, err := json.Marshal(original)
	if err != nil {
		t.Fatalf("Marshal error: %v", err)
	}

	var restored CustomDate
	err = json.Unmarshal(data, &restored)
	if err != nil {
		t.Fatalf("Unmarshal error: %v", err)
	}

	if original.Time.Format("2006-01-02") != restored.Time.Format("2006-01-02") {
		t.Errorf("Round trip failed: original=%s, restored=%s",
			original.Time.Format("2006-01-02"),
			restored.Time.Format("2006-01-02"))
	}
}

func TestBooking_JSONSerialization(t *testing.T) {
	booking := Booking{
		BookingID:   1,
		UserID:      2,
		RoomID:      3,
		Title:       "Test Booking",
		BookingDate: CustomDate{Time: time.Date(2026, 3, 24, 0, 0, 0, 0, time.UTC)},
		StartTime:   "09:00",
		EndTime:     "10:00",
		Status:      "pending",
	}

	data, err := json.Marshal(booking)
	if err != nil {
		t.Fatalf("Marshal error: %v", err)
	}

	var result map[string]interface{}
	json.Unmarshal(data, &result)

	if result["booking_id"].(float64) != 1 {
		t.Errorf("booking_id = %v, want 1", result["booking_id"])
	}
	if result["booking_date"] != "2026-03-24" {
		t.Errorf("booking_date = %v, want '2026-03-24'", result["booking_date"])
	}
	if result["status"] != "pending" {
		t.Errorf("status = %v, want 'pending'", result["status"])
	}
}
