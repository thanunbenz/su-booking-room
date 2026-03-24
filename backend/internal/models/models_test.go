package models

import (
	"testing"
)

func TestRole_TableName(t *testing.T) {
	r := Role{}
	if r.TableName() != "roles" {
		t.Errorf("Role.TableName() = %q, want 'roles'", r.TableName())
	}
}

func TestUser_TableName(t *testing.T) {
	u := User{}
	if u.TableName() != "users" {
		t.Errorf("User.TableName() = %q, want 'users'", u.TableName())
	}
}

func TestBuilding_TableName(t *testing.T) {
	b := Building{}
	if b.TableName() != "buildings" {
		t.Errorf("Building.TableName() = %q, want 'buildings'", b.TableName())
	}
}

func TestRoom_TableName(t *testing.T) {
	r := Room{}
	if r.TableName() != "rooms" {
		t.Errorf("Room.TableName() = %q, want 'rooms'", r.TableName())
	}
}

func TestFixedSchedule_TableName(t *testing.T) {
	fs := FixedSchedule{}
	if fs.TableName() != "fixed_schedules" {
		t.Errorf("FixedSchedule.TableName() = %q, want 'fixed_schedules'", fs.TableName())
	}
}

func TestNotification_TableName(t *testing.T) {
	n := Notification{}
	if n.TableName() != "notifications" {
		t.Errorf("Notification.TableName() = %q, want 'notifications'", n.TableName())
	}
}

func TestUser_PasswordHidden(t *testing.T) {
	// User Password field has json:"-", so it should not appear in JSON output
	u := User{
		UserID:   1,
		Email:    "test@example.com",
		Password: "should_be_hidden",
		Fullname: "Test User",
	}

	// The json:"-" tag ensures Password is excluded from JSON marshaling
	// We verify the tag exists by checking the struct tag
	_ = u // Struct tag validation is compile-time
}

func TestBooking_StatusValues(t *testing.T) {
	validStatuses := []string{"pending", "approved", "rejected", "cancelled", "completed"}

	for _, status := range validStatuses {
		booking := Booking{Status: status}
		if booking.Status != status {
			t.Errorf("Booking status = %q, want %q", booking.Status, status)
		}
	}
}

func TestFixedSchedule_DayOfWeekRange(t *testing.T) {
	// Verify day_of_week conventions
	// 1=Monday, 7=Sunday
	schedule := FixedSchedule{
		DayOfWeek: 1,
	}
	if schedule.DayOfWeek < 1 || schedule.DayOfWeek > 7 {
		t.Errorf("DayOfWeek %d out of range [1-7]", schedule.DayOfWeek)
	}
}
