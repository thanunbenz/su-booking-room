# Booking PDF Print

Server-side PDF generation for booking confirmations. Supports single-booking door notices and multi-booking reports, available to **Admin users only**.

---

## Overview

| Capability | Description |
|---|---|
| Single PDF | Download one booking as a printable notice (A4 landscape, one per page) |
| Batch by selection | Select multiple bookings via checkbox, download as one PDF |
| Batch by filter | Print all bookings matching current filter (room / date) |
| Style toggle | `notice` (door notice, 1/page) or `report` (compact table, many/page) |
| Footer toggle | Show / hide the "พิมพ์เมื่อ ... · รหัสการจอง #BK-..." line |

**Approved-only rule**: PDFs are only issued for bookings with `status = "approved"`. Enforced server-side — pending/rejected/cancelled/completed bookings return `400 Bad Request`. Batch endpoint silently filters to approved and returns `404` if none match.

---

## API

All endpoints require JWT auth + Admin role (`role_id = 1`).

### `GET /api/v1/bookings/:id/pdf`

Download a single booking.

Query params:

| Param | Values | Default | Purpose |
|---|---|---|---|
| `style` | `notice` \| `report` | `notice` | Layout variant |
| `footer` | `0` \| `1` | `1` | Toggle printed-at footer |

Response: `application/pdf` with `Content-Disposition: attachment; filename="booking-<id>.pdf"`.

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/bookings/33/pdf?style=notice&footer=1" \
  -o booking-33.pdf
```

### `POST /api/v1/bookings/pdf/batch`

Download many bookings as one PDF. Provide **either** `ids` (explicit selection) **or** `filter`.

Request body:

```json
{
  "ids": [33, 32, 31],
  "style": "notice",
  "show_footer": true
}
```

or filter-based:

```json
{
  "filter": { "status": "approved", "room_id": 33, "booking_date": "2026-04-25" },
  "style": "report",
  "show_footer": false
}
```

Rules:
- At least one of `ids` or `filter` must be provided
- Returns `404` if no bookings match
- Bookings are ordered by `booking_date ASC, start_time ASC`

Response filename: `bookings-<YYYYMMDD-HHMMSS>.pdf` (notice) or `bookings-report-<...>.pdf`.

---

## PDF styles

### `notice` — A4 landscape door notice

One booking per page. Designed to be printed and posted on the room door.

```
                                            Meeting Room

                          {Booking.Title}

                     ห้อง {Room.Name} · {Building.Name}


            วันพุธที่ 25 เมษายน 2569   เวลา 09.00 - 12.00 น.

                     ผู้จอง: {User.Fullname}

                                                 (footer if enabled)
```

Typography:
- Subject: Noto Sans Thai Bold 36pt
- Room line: 18pt
- Date + time: 22pt
- Booker: 14pt
- Footer: 9pt (toggleable)

### `report` — A4 portrait compact table

Many bookings per page. For admin overview or archival.

Columns: `#`, `รหัส` (booking ID), `วันที่`, `เวลา`, `ห้อง`, `หัวข้อ`, `ผู้จอง`, `สถานะ`.

Status labels are shortened Thai (`รอ` / `อนุมัติ` / `ปฏิเสธ` / `ยกเลิก` / `เสร็จ`).

---

## Frontend

### Single print

Available on:
- `/booking/[id]` — one button in the detail page action area
- `/my-bookings` — per-row button
- `/admin/bookings` — per-row button

Uses the current toolbar `style` + `showFooter` settings (admin page) or defaults (other pages).

### Batch print (admin page only)

Toolbar above the bookings list:

1. Style selector: `แปะหน้าห้อง` / `สรุปรายการ`
2. `แสดง footer` checkbox
3. `พิมพ์ที่เลือก (N)` — button enabled when ≥1 checkbox selected
4. `พิมพ์ทั้งหมด (ตาม filter)` — button prints everything matching current status/room/date filter

Each booking row has a checkbox. The list header has a "เลือกทั้งหมดในหน้านี้" toggle.

---

## Implementation

### Key files

| Path | Role |
|---|---|
| [backend/internal/utils/pdf.go](../../backend/internal/utils/pdf.go) | Embedded Thai fonts + `GenerateBookingPDF` / `GenerateBookingsPDF` |
| [backend/internal/utils/fonts/](../../backend/internal/utils/fonts/) | Noto Sans Thai TTF (Regular + Bold) embedded via `//go:embed` |
| [backend/internal/handlers/booking_handler.go](../../backend/internal/handlers/booking_handler.go) | `DownloadPDF`, `DownloadBatchPDF` |
| [backend/internal/routes/routes.go](../../backend/internal/routes/routes.go) | Route registration |
| [backend/main.go](../../backend/main.go) | `utils.InitPDFFonts()` called at startup (fatal if font bytes empty) |
| [frontend/src/lib/downloadBookingPDF.ts](../../frontend/src/lib/downloadBookingPDF.ts) | Client helpers: `downloadBookingPDF`, `downloadBookingsByIds`, `downloadBookingsByFilter` |
| [frontend/src/lib/api/client.ts](../../frontend/src/lib/api/client.ts) | `bookingApi.downloadPDF`, `bookingApi.downloadBatchPDF` |

### Library

- `github.com/jung-kurt/gofpdf v1.16.2`
- Font: **Noto Sans Thai** (OFL 1.1 license), static Regular + Bold variants, ~72 KB each, embedded into the Go binary

### Go types

```go
type PDFStyle string
const (
    PDFStyleNotice PDFStyle = "notice"
    PDFStyleReport PDFStyle = "report"
)

type PDFOptions struct {
    Style      PDFStyle
    ShowFooter bool
}

func DefaultPDFOptions() PDFOptions  // { Notice, ShowFooter: true }

func GenerateBookingPDF(b *models.Booking, opts PDFOptions) ([]byte, error)
func GenerateBookingsPDF(bookings []models.Booking, opts PDFOptions) ([]byte, error)
```

The booking must have `User.Role`, `Room`, and `Room.Building` preloaded.

---

## Testing

```bash
# Unit test — verifies PDF bytes start with "%PDF-" and size > 1KB
cd backend && go test -v ./internal/utils/ -run TestGenerateBookingPDF
```

Manual end-to-end:

```bash
# Start backend (make dev-backend) then:
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@silpakorn.edu","password":"password123"}' \
  | jq -r '.data.tokens.access_token')

# Single notice
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/bookings/1/pdf" -o notice.pdf

# Single report without footer
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/bookings/1/pdf?style=report&footer=0" -o report.pdf

# Batch by ids
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"ids":[1,2,3],"style":"notice"}' \
  "http://localhost:8000/api/v1/bookings/pdf/batch" -o batch.pdf

# Batch by filter
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"filter":{"status":"approved"},"style":"report"}' \
  "http://localhost:8000/api/v1/bookings/pdf/batch" -o filtered.pdf
```

---

## Notes & Limitations

- **Thai line wrapping**: `gofpdf.MultiCell` wraps on spaces. Thai has no spaces — long titles without spaces wrap at character boundaries. Acceptable for the current field lengths.
- **Emoji in user-entered text**: renders as empty glyphs (Noto Sans Thai has no emoji coverage).
- **Multi-day bookings**: current data model stores a single `booking_date` + `start_time`/`end_time`. The layout is ready to display multiple lines when the schema is extended with an `end_date` field.
- **Concurrency**: each request creates its own `Fpdf` instance — no shared state.
- **Docker**: fonts are embedded in the binary via `//go:embed`, so `FROM scratch`/distroless images need no extra `COPY`.
- **Access control**: enforced server-side by `AdminOnly` middleware. The frontend additionally hides the buttons when `user.role.role_name !== 'admin'`.
