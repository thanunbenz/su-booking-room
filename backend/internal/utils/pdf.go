package utils

import (
	"bytes"
	_ "embed"
	"fmt"
	"strings"
	"time"

	"github.com/jung-kurt/gofpdf"
	"github.com/thanunbenz/su-booking-room/internal/models"
)

//go:embed fonts/NotoSansThai-Regular.ttf
var notoRegular []byte

//go:embed fonts/NotoSansThai-Bold.ttf
var notoBold []byte

// PDFStyle selects the layout for booking PDFs.
type PDFStyle string

const (
	// PDFStyleNotice is the A4-landscape single-booking-per-page door notice.
	PDFStyleNotice PDFStyle = "notice"
	// PDFStyleReport is the A4-portrait compact multi-booking-per-page table.
	PDFStyleReport PDFStyle = "report"
)

// PDFOptions controls how booking PDFs are rendered.
type PDFOptions struct {
	Style      PDFStyle
	ShowFooter bool
}

// DefaultPDFOptions returns the sensible defaults used when the caller
// does not supply options (notice style, footer visible).
func DefaultPDFOptions() PDFOptions {
	return PDFOptions{Style: PDFStyleNotice, ShowFooter: true}
}

// InitPDFFonts verifies the embedded Thai fonts are present at startup.
func InitPDFFonts() error {
	if len(notoRegular) == 0 {
		return fmt.Errorf("embedded NotoSansThai-Regular.ttf is empty")
	}
	if len(notoBold) == 0 {
		return fmt.Errorf("embedded NotoSansThai-Bold.ttf is empty")
	}
	return nil
}

var thaiWeekdays = []string{
	"วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ",
	"วันพฤหัสบดี", "วันศุกร์", "วันเสาร์",
}

var thaiMonths = []string{
	"มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
	"กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
}

var thaiMonthsShort = []string{
	"ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
	"ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
}

// formatThaiFullDate returns "วันพุธที่ 12 กุมภาพันธ์ 2568".
func formatThaiFullDate(t time.Time) string {
	if t.IsZero() {
		return "-"
	}
	return fmt.Sprintf("%sที่ %d %s %d",
		thaiWeekdays[int(t.Weekday())],
		t.Day(),
		thaiMonths[int(t.Month())-1],
		t.Year()+543,
	)
}

// formatThaiShortDate returns "12 ก.พ. 2568".
func formatThaiShortDate(t time.Time) string {
	if t.IsZero() {
		return "-"
	}
	return fmt.Sprintf("%d %s %d",
		t.Day(), thaiMonthsShort[int(t.Month())-1], t.Year()+543,
	)
}

// FormatDateRange is the exported form of formatDateCell — used by callers
// outside this package (e.g. email templates) to render a Thai date or
// date range in a compact format.
func FormatDateRange(start, end time.Time) string {
	return formatDateCell(start, end)
}

// formatDateCell renders a compact date (or date range) for tabular cells.
// Single day: "12 ก.พ. 2568". Same month: "12-14 ก.พ. 2568". Cross-month:
// "28 ก.พ. - 2 มี.ค. 2568". Cross-year: "28 ธ.ค. 2568 - 2 ม.ค. 2569".
func formatDateCell(start, end time.Time) string {
	if end.IsZero() || end.Equal(start) {
		return formatThaiShortDate(start)
	}
	sY, sM, sD := start.Year()+543, int(start.Month()), start.Day()
	eY, eM, eD := end.Year()+543, int(end.Month()), end.Day()
	if sY == eY && sM == eM {
		return fmt.Sprintf("%d-%d %s %d", sD, eD, thaiMonthsShort[sM-1], sY)
	}
	if sY == eY {
		return fmt.Sprintf("%d %s - %d %s %d",
			sD, thaiMonthsShort[sM-1], eD, thaiMonthsShort[eM-1], sY)
	}
	return fmt.Sprintf("%d %s %d - %d %s %d",
		sD, thaiMonthsShort[sM-1], sY, eD, thaiMonthsShort[eM-1], eY)
}

// formatThaiTimeRange returns "08.30 - 16.30 น." from HH:MM:SS inputs.
func formatThaiTimeRange(start, end string) string {
	return fmt.Sprintf("%s - %s น.", dotTime(start), dotTime(end))
}

// daysBetweenInclusive counts the number of calendar days between two dates,
// inclusive of both endpoints. Same day returns 1.
func daysBetweenInclusive(start, end time.Time) int {
	s := start.Truncate(24 * time.Hour)
	e := end.Truncate(24 * time.Hour)
	if e.Before(s) {
		return 0
	}
	return int(e.Sub(s).Hours()/24) + 1
}

// dotTime converts "HH:MM[:SS]" to "HH.MM".
func dotTime(s string) string {
	if len(s) >= 5 {
		return strings.Replace(s[:5], ":", ".", 1)
	}
	return s
}

// formatPrintedTimestamp returns "23 เมษายน 2569 09.28 น.".
func formatPrintedTimestamp(t time.Time) string {
	return fmt.Sprintf("%d %s %d %02d.%02d น.",
		t.Day(), thaiMonths[int(t.Month())-1], t.Year()+543,
		t.Hour(), t.Minute(),
	)
}

// newPDF creates a fresh Fpdf with Thai fonts registered.
func newPDF(orientation string) *gofpdf.Fpdf {
	pdf := gofpdf.New(orientation, "mm", "A4", "")
	pdf.AddUTF8FontFromBytes("NotoThai", "", notoRegular)
	pdf.AddUTF8FontFromBytes("NotoThai", "B", notoBold)
	return pdf
}

// drawNoticePage renders one booking as an A4-landscape door notice onto pdf.
// Call AddPage() before invoking this.
func drawNoticePage(pdf *gofpdf.Fpdf, b *models.Booking, showFooter bool) {
	pageW, _ := pdf.GetPageSize()

	// Top-right small header — tied to the same toggle as the bottom footer
	if showFooter {
		pdf.SetFont("NotoThai", "", 10)
		pdf.SetTextColor(75, 85, 99)
		pdf.SetXY(pageW-60, 12)
		pdf.CellFormat(35, 5, "Meeting Room", "", 0, "R", false, 0, "")
	}

	// Subject
	pdf.SetY(50)
	pdf.SetFont("NotoThai", "B", 36)
	pdf.SetTextColor(17, 24, 39)
	pdf.MultiCell(0, 16, b.Title, "", "C", false)

	// Room line
	pdf.Ln(2)
	pdf.SetFont("NotoThai", "", 18)
	pdf.SetTextColor(55, 65, 81)
	roomLine := "ห้อง " + b.Room.Name
	if b.Room.Building.Name != "" {
		roomLine += " · " + b.Room.Building.Name
	}
	pdf.CellFormat(0, 10, roomLine, "", 1, "C", false, 0, "")

	pdf.Ln(10)

	// Date + time — single-day shows one line, multi-day shows one line per day
	// (matches the university's existing paper notice style).
	timeStr := formatThaiTimeRange(b.StartTime, b.EndTime)
	endDate := b.EndDate.Time
	if endDate.IsZero() {
		endDate = b.BookingDate.Time
	}
	days := daysBetweenInclusive(b.BookingDate.Time, endDate)

	// Shrink font slightly when many days must fit on one page.
	dateFontSize := 22.0
	dateLineH := 12.0
	switch {
	case days > 7:
		dateFontSize = 14
		dateLineH = 8
	case days > 3:
		dateFontSize = 18
		dateLineH = 10
	}
	pdf.SetFont("NotoThai", "", dateFontSize)
	pdf.SetTextColor(17, 24, 39)
	const maxListedDays = 10
	shown := 0
	for d := b.BookingDate.Time; !d.After(endDate); d = d.AddDate(0, 0, 1) {
		if shown >= maxListedDays {
			remaining := days - shown
			pdf.SetFont("NotoThai", "", dateFontSize*0.8)
			pdf.SetTextColor(107, 114, 128)
			pdf.CellFormat(0, dateLineH,
				fmt.Sprintf("... และอีก %d วัน", remaining),
				"", 1, "C", false, 0, "")
			break
		}
		line := formatThaiFullDate(d) + "   เวลา " + timeStr
		pdf.CellFormat(0, dateLineH, line, "", 1, "C", false, 0, "")
		shown++
	}

	// Booker
	pdf.Ln(4)
	pdf.SetFont("NotoThai", "", 14)
	pdf.SetTextColor(75, 85, 99)
	pdf.CellFormat(0, 7, "ผู้จอง: "+b.User.Fullname, "", 1, "C", false, 0, "")

	if showFooter {
		pdf.SetY(-18)
		pdf.SetFont("NotoThai", "", 9)
		pdf.SetTextColor(156, 163, 175)
		pdf.CellFormat(0, 5,
			fmt.Sprintf("พิมพ์เมื่อ %s  ·  รหัสการจอง #BK-%06d",
				formatPrintedTimestamp(time.Now()), b.BookingID),
			"", 1, "C", false, 0, "")
	}
}

// Column widths (mm) and labels for the report table. Sum = 190mm, fits A4
// portrait with 15mm side margins (210 - 15*2 = 180mm usable) — wait, sum is
// actually 8+20+25+24+24+32+30+14 = 177, leaving a little breathing room.
var reportTableWidths = []float64{8, 20, 25, 24, 24, 32, 30, 14}
var reportTableHeaders = []string{"#", "รหัส", "วันที่", "เวลา", "ห้อง", "หัวข้อ", "ผู้จอง", "สถานะ"}

// drawReportDocHeader renders the document-level header (title + meta).
// Called once on page 1 only.
func drawReportDocHeader(pdf *gofpdf.Fpdf, count int) {
	pdf.SetFont("NotoThai", "B", 18)
	pdf.SetTextColor(17, 24, 39)
	pdf.CellFormat(0, 10, "รายการการจองห้อง", "", 1, "L", false, 0, "")

	pdf.SetFont("NotoThai", "", 10)
	pdf.SetTextColor(107, 114, 128)
	pdf.CellFormat(0, 5,
		fmt.Sprintf("พิมพ์เมื่อ %s  ·  รวม %d รายการ",
			formatPrintedTimestamp(time.Now()), count),
		"", 1, "L", false, 0, "")

	pdf.Ln(4)
}

// drawReportTableColumnHeader renders the column-label row. Repeats on every
// page so readers can always see what each column means.
func drawReportTableColumnHeader(pdf *gofpdf.Fpdf) {
	pdf.SetFont("NotoThai", "B", 9)
	pdf.SetFillColor(240, 253, 250)
	pdf.SetTextColor(15, 118, 110)
	pdf.SetDrawColor(209, 213, 219)
	pdf.SetLineWidth(0.2)
	for i, h := range reportTableHeaders {
		pdf.CellFormat(reportTableWidths[i], 8, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)
}

// drawReportTableRows renders the booking rows. Auto-page-break is expected
// to be enabled — each overflow triggers the header func, which redraws the
// column header on the new page.
func drawReportTableRows(pdf *gofpdf.Fpdf, bookings []models.Booking) {
	pdf.SetFont("NotoThai", "", 9)
	pdf.SetTextColor(31, 41, 55)
	pdf.SetFillColor(249, 250, 251)
	for i, b := range bookings {
		fill := i%2 == 1
		cells := []string{
			fmt.Sprintf("%d", i+1),
			fmt.Sprintf("BK-%06d", b.BookingID),
			formatDateCell(b.BookingDate.Time, b.EndDate.Time),
			fmt.Sprintf("%s-%s", dotTime(b.StartTime), dotTime(b.EndTime)),
			b.Room.Name,
			truncate(b.Title, 26),
			truncate(b.User.Fullname, 22),
			thaiStatusShort(b.Status),
		}
		for j, c := range cells {
			align := "L"
			if j == 0 || j == 2 || j == 3 || j == 7 {
				align = "C"
			}
			pdf.CellFormat(reportTableWidths[j], 7, c, "1", 0, align, fill, 0, "")
		}
		pdf.Ln(-1)
	}
}

// drawReportFooter renders the page footer band.
// Uses explicit half-widths so the "หน้า N" cell does not overflow the page
// (fixed from the earlier width=0 overlap bug).
func drawReportFooter(pdf *gofpdf.Fpdf) {
	pageW, _ := pdf.GetPageSize()
	margin := 15.0
	halfW := (pageW - margin*2) / 2

	pdf.SetY(-15)
	pdf.SetFont("NotoThai", "", 8)
	pdf.SetTextColor(156, 163, 175)
	pdf.CellFormat(halfW, 5, "Silpakorn University — Room Booking Report",
		"", 0, "L", false, 0, "")
	pdf.CellFormat(halfW, 5, fmt.Sprintf("หน้า %d", pdf.PageNo()),
		"", 0, "R", false, 0, "")
}

func thaiStatusShort(s string) string {
	switch s {
	case "pending":
		return "รอ"
	case "approved":
		return "อนุมัติ"
	case "rejected":
		return "ปฏิเสธ"
	case "cancelled":
		return "ยกเลิก"
	case "completed":
		return "เสร็จ"
	default:
		return s
	}
}

func truncate(s string, n int) string {
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return string(r[:n-1]) + "…"
}

// GenerateBookingPDF renders a single booking. Defaults to notice style.
// The booking must have User, Room, and Room.Building preloaded.
func GenerateBookingPDF(b *models.Booking, opts PDFOptions) ([]byte, error) {
	if opts.Style == "" {
		opts.Style = PDFStyleNotice
	}

	if opts.Style == PDFStyleReport {
		return GenerateBookingsPDF([]models.Booking{*b}, opts)
	}

	pdf := newPDF("L")
	pdf.SetMargins(25, 20, 25)
	pdf.SetAutoPageBreak(false, 0)
	pdf.AddPage()
	drawNoticePage(pdf, b, opts.ShowFooter)

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("pdf output: %w", err)
	}
	return buf.Bytes(), nil
}

// GenerateBookingsPDF renders multiple bookings per the selected style.
// Notice style: one booking per landscape page. Report style: compact table.
// Each booking must have User, Room, and Room.Building preloaded.
func GenerateBookingsPDF(bookings []models.Booking, opts PDFOptions) ([]byte, error) {
	if opts.Style == "" {
		opts.Style = PDFStyleNotice
	}
	if len(bookings) == 0 {
		return nil, fmt.Errorf("no bookings to render")
	}

	if opts.Style == PDFStyleReport {
		pdf := newPDF("P")
		pdf.SetMargins(15, 15, 15)
		// Leave 20mm at bottom so the footer never overlaps table rows.
		pdf.SetAutoPageBreak(true, 20)

		// HeaderFunc runs on every AddPage (including auto-page-breaks),
		// so the column header repeats; the doc title only shows on page 1.
		pdf.SetHeaderFunc(func() {
			if pdf.PageNo() == 1 {
				drawReportDocHeader(pdf, len(bookings))
			}
			drawReportTableColumnHeader(pdf)
		})

		if opts.ShowFooter {
			pdf.SetFooterFunc(func() { drawReportFooter(pdf) })
		}

		pdf.AddPage()
		drawReportTableRows(pdf, bookings)

		var buf bytes.Buffer
		if err := pdf.Output(&buf); err != nil {
			return nil, fmt.Errorf("pdf output: %w", err)
		}
		return buf.Bytes(), nil
	}

	// Notice style: one per page
	pdf := newPDF("L")
	pdf.SetMargins(25, 20, 25)
	pdf.SetAutoPageBreak(false, 0)
	for i := range bookings {
		pdf.AddPage()
		drawNoticePage(pdf, &bookings[i], opts.ShowFooter)
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("pdf output: %w", err)
	}
	return buf.Bytes(), nil
}
