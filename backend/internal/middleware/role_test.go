package middleware

import (
	"testing"
)

func TestRoleConstants(t *testing.T) {
	// Verify role constants match expected values
	if RoleAdmin != 1 {
		t.Errorf("RoleAdmin = %d, want 1", RoleAdmin)
	}
	if RoleTeacher != 2 {
		t.Errorf("RoleTeacher = %d, want 2", RoleTeacher)
	}
	if RoleVisitor != 3 {
		t.Errorf("RoleVisitor = %d, want 3", RoleVisitor)
	}
}
