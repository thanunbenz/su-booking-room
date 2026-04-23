package utils

import (
	"bytes"
	"os"
	"testing"
	"time"

	"github.com/thanunbenz/su-booking-room/internal/models"
)

func TestGenerateBookingPDF(t *testing.T) {
	if err := InitPDFFonts(); err != nil {
		t.Fatalf("InitPDFFonts: %v", err)
	}

	b := &models.Booking{
		BookingID:        1234,
		Title:            "สอนวิชา Data Structures",
		Detail:           "ใช้ห้องคอมเพื่อสอน lab เรื่อง linked list และ tree",
		EquipmentRequest: "คอมพิวเตอร์ 20 เครื่อง, โปรเจคเตอร์ 1 เครื่อง",
		BookingDate:      models.CustomDate{Time: time.Date(2026, 4, 25, 0, 0, 0, 0, time.UTC)},
		StartTime:        "09:00:00",
		EndTime:          "12:00:00",
		Status:           "approved",
		StatusNote:       "",
		User: models.User{
			Fullname: "ธนัน เบนซ์",
			Email:    "thanun.benz@silpakorn.edu",
		},
		Room: models.Room{
			Name: "IT-301",
			Building: models.Building{
				Name: "อาคารคณะ ICT",
			},
		},
	}

	out, err := GenerateBookingPDF(b, DefaultPDFOptions())
	if err != nil {
		t.Fatalf("GenerateBookingPDF: %v", err)
	}
	if !bytes.HasPrefix(out, []byte("%PDF-")) {
		t.Fatalf("output does not look like a PDF: first bytes = %q", out[:min(20, len(out))])
	}
	if len(out) < 1000 {
		t.Fatalf("PDF suspiciously small: %d bytes", len(out))
	}

	// Optional: dump to /tmp for manual inspection when running with -v
	if testing.Verbose() {
		_ = os.WriteFile("/tmp/booking-test.pdf", out, 0o644)
		t.Logf("wrote %d bytes to /tmp/booking-test.pdf", len(out))
	}
}

func TestGenerateBookingsPDF_MultiPageReport(t *testing.T) {
	if err := InitPDFFonts(); err != nil {
		t.Fatalf("InitPDFFonts: %v", err)
	}

	// Produce 50 bookings — comfortably overflows a single A4 portrait page
	// at ~7mm per row, forcing auto-page-break and exercising the header func.
	bookings := make([]models.Booking, 50)
	for i := range bookings {
		bookings[i] = models.Booking{
			BookingID:   i + 1,
			Title:       "สอนวิชา Data Structures",
			BookingDate: models.CustomDate{Time: time.Date(2026, 4, 25, 0, 0, 0, 0, time.UTC)},
			StartTime:   "09:00:00",
			EndTime:     "12:00:00",
			Status:      "approved",
			User:        models.User{Fullname: "ธนัน เบนซ์"},
			Room: models.Room{
				Name:     "IT-301",
				Building: models.Building{Name: "อาคาร ICT"},
			},
		}
	}

	out, err := GenerateBookingsPDF(bookings, PDFOptions{Style: PDFStyleReport, ShowFooter: true})
	if err != nil {
		t.Fatalf("GenerateBookingsPDF: %v", err)
	}
	if !bytes.HasPrefix(out, []byte("%PDF-")) {
		t.Fatalf("output not a PDF")
	}

	if testing.Verbose() {
		_ = os.WriteFile("/tmp/report-multipage-test.pdf", out, 0o644)
		t.Logf("wrote %d bytes to /tmp/report-multipage-test.pdf", len(out))
	}
}
