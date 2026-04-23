# Multi-Day Booking

Bookings can span consecutive days (e.g. a 3-day workshop) with the same time window each day. Single-day remains the common case.

---

## Data model

Single field added to [backend/internal/models/booking.go](../../backend/internal/models/booking.go):

```go
EndDate CustomDate `gorm:"type:date;not null;index" json:"end_date"`
```

**Semantics**:
- `booking_date` = start (inclusive)
- `end_date` = end (inclusive), defaults to `booking_date` for single-day
- `start_time` / `end_time` apply to every day in the range
- Max range: **30 days** (hard cap)

---

## Migration

GORM AutoMigrate cannot add a `NOT NULL` column to an existing table. The backfill is done via raw SQL in [backend/internal/config/database.go](../../backend/internal/config/database.go), guarded by column existence so it is idempotent:

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE bookings ADD COLUMN end_date DATE;
    UPDATE bookings SET end_date = booking_date WHERE end_date IS NULL;
    ALTER TABLE bookings ALTER COLUMN end_date SET NOT NULL;
  END IF;
END $$;
```

Safe to re-run on every startup.

---

## API

### `POST /api/v1/bookings`

Add optional `end_date` to the body:

```json
{
  "room_id": 33,
  "title": "อบรม e-Bidding",
  "booking_date": "2026-06-20",
  "end_date": "2026-06-22",
  "start_time": "08:30",
  "end_time": "16:30"
}
```

Omit `end_date` for single-day (server defaults it to `booking_date`).

### Validation

| Rule | Error |
|------|-------|
| `end_date < booking_date` | `400 end_date ต้องไม่น้อยกว่า booking_date` |
| Range > 30 days | `400 ช่วงวันที่จองยาวเกิน 30 วัน` |
| Any day overlaps existing booking | `409 Time slot is already booked` |
| Any day overlaps fixed schedule | `409 วันที่ YYYY-MM-DD ซ้อนกับตารางประจำของห้อง` |

### Conflict detection (range overlap)

```sql
existing.booking_date <= new.end_date
  AND existing.end_date >= new.booking_date
  AND start_time < new.end_time
  AND end_time > new.start_time
```

Fixed-schedule check loops through each day of the range to match `day_of_week`. Capped by the 30-day limit, so worst case = 30 queries.

---

## UI

**Form** [frontend/src/app/booking/page.tsx](../../frontend/src/app/booking/page.tsx): two date inputs side-by-side — "วันที่เริ่ม" and "วันสิ้นสุด (ไม่ใส่ = จองวันเดียว)". Shows a "จอง X วัน" badge when range > 1 day. The `end_date` input's `min` attribute is tied to `booking_date`.

**Display helper** [frontend/src/lib/formatDate.ts](../../frontend/src/lib/formatDate.ts):

- Single day → "25 เมษายน 2569"
- Same month → "25-27 เม.ย. 2569"
- Cross month → "28 เม.ย. - 2 พ.ค. 2569"
- Cross year → "28 ธ.ค. 2569 - 2 ม.ค. 2570"

Used by my-bookings, admin/bookings, booking detail, calendar.

---

## PDF rendering

**Notice style** ([pdf.go](../../backend/internal/utils/pdf.go), `drawNoticePage`): multi-day shows one line per day — matching the university's paper notices. Auto-shrinks font when the range is long:

| Days | Font size |
|------|-----------|
| 1-3  | 22pt |
| 4-7  | 18pt |
| 8-10 | 14pt |
| >10  | First 10 + "... และอีก N วัน" |

**Report style**: date column uses the same compact range format as the UI (`FormatDateRange` exported from `utils`).

---

## Email

[notification_service.go](../../backend/internal/services/notification_service.go) passes `utils.FormatDateRange(start, end)` to the template data. Both in-app message strings and HTML templates automatically render the range.

---

## Known limitations (intentional)

- **Recurring bookings** (e.g. "every Tuesday for a semester") are out of scope — use `fixed_schedules` instead
- **Different time per day** not supported — use separate bookings
- **Reminder fires on start day only** — the 24h-before reminder targets the first day, not every day of a range
