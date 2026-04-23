# Plan: Multi-Day Booking Support

## Context

**Why**: CLAUDE.md lists "Multi-day booking support" as an unfinished feature. Current schema holds one date per booking; users who need workshops/conferences spanning 2–5 consecutive days must create separate bookings for each day — tedious, and conflict detection runs per-booking.

**Outcome**: One booking can represent a contiguous date range (e.g. 25–27 เม.ย.) with the same time window each day. Single-day bookings remain the common case and keep their current UX.

**Scope**: Consecutive days only. Recurring bookings (e.g. "every Tuesday") are out of scope — that's a separate feature using `fixed_schedules`.

---

## Data model

Add one field to [backend/internal/models/booking.go](../../backend/internal/models/booking.go):

```go
EndDate CustomDate `gorm:"type:date;not null;index" json:"end_date" validate:"required"`
```

**Semantics**:
- `booking_date` becomes the **start date** (kept name for backwards compat — rename would churn too much)
- `end_date >= booking_date`
- Single-day: `end_date == booking_date`
- `start_time` / `end_time` apply to **every day** in the range

**Migration strategy** (GORM AutoMigrate, see [backend/internal/config/database.go:52](../../backend/internal/config/database.go)):
1. GORM adds the `end_date` column (nullable initially because existing rows have no value)
2. Explicit backfill SQL in `database.go` after AutoMigrate:
   ```go
   db.Exec("UPDATE bookings SET end_date = booking_date WHERE end_date IS NULL")
   ```
3. Alter column to `NOT NULL` (or leave as-is — backfill ensures no NULLs)
4. Drop existing `idx_room_date_time` and rebuild as `idx_room_range_time(room_id, booking_date, end_date, start_time)` — better selectivity for range overlap queries

Alternative: keep the old index and add `idx_bookings_end_date` separately. Simpler, slightly slower for range scans. **Recommend**: go simple — add index on `end_date` only; the conflict query uses an OR filter that both indexes help.

---

## Conflict detection

**Current** ([booking_handler.go:189-197](../../backend/internal/handlers/booking_handler.go#L189-L197)):

```go
h.DB.Where("room_id = ? AND booking_date = ? AND status IN (?, ?)", ...).
    Where("start_time < ? AND end_time > ?", input.EndTime, input.StartTime).
```

**New range-overlap predicate**:

```
(existing.booking_date <= new.end_date AND existing.end_date >= new.booking_date)
  AND existing.start_time < new.end_time
  AND existing.end_time > new.start_time
```

GORM:

```go
h.DB.Model(&models.Booking{}).
    Where("room_id = ? AND status IN (?, ?)", input.RoomID, "pending", "approved").
    Where("booking_date <= ? AND end_date >= ?", input.EndDate.Time, input.BookingDate.Time).
    Where("start_time < ? AND end_time > ?", input.EndTime, input.StartTime).
    Count(&conflictCount)
```

**Fixed schedule conflict** ([booking_handler.go:205-213](../../backend/internal/handlers/booking_handler.go#L205-L213)):
Currently checks one `DayOfWeek`. For ranges, iterate over each day `d` from `booking_date` to `end_date` and check `fixed_schedules` where `day_of_week = weekday(d)` and the time window overlaps. A 3-day range = 3 day-of-week checks. Cap range to 30 days (validation) so worst case is 30 queries — acceptable.

---

## Validation (new rules)

In booking handler before conflict check:

```go
if input.EndDate.Time.Before(input.BookingDate.Time) {
    return utils.BadRequestResponse(c, "end_date ต้องไม่น้อยกว่า booking_date")
}
maxRange := input.BookingDate.Time.AddDate(0, 0, 30)
if input.EndDate.Time.After(maxRange) {
    return utils.BadRequestResponse(c, "ช่วงวันที่จองยาวเกิน 30 วัน")
}
// Past-date check extended to EndDate too — a booking ending in the past is not useful
```

---

## Backend changes

| File | Change |
|---|---|
| [backend/internal/models/booking.go](../../backend/internal/models/booking.go) | Add `EndDate CustomDate` field with index |
| [backend/internal/config/database.go](../../backend/internal/config/database.go) | Add backfill SQL after AutoMigrate; add `end_date` index |
| [backend/internal/handlers/booking_handler.go](../../backend/internal/handlers/booking_handler.go) | Update `Create` validation + range conflict query + fixed schedule loop; update PDF batch filter if it uses `booking_date` |
| [backend/internal/handlers/booking_handler.go](../../backend/internal/handlers/booking_handler.go) (GetAll / GetMyBookings) | Optionally add query filter `?date=YYYY-MM-DD` that checks whether date falls within any booking's range (uses same overlap predicate) |

---

## Frontend changes

[frontend/src/app/booking/page.tsx](../../frontend/src/app/booking/page.tsx) is the create form (uses native `<input type="date">`, line 357).

**Form state** (around line 26):

```tsx
const [formData, setFormData] = useState({
  room_id: 0,
  booking_date: '',
  end_date: '',           // NEW — defaults to booking_date if left empty
  start_time: '',
  end_time: '',
  title: '',
  detail: '',
  equipment_request: '',
})
```

**UI**:
- Keep existing `booking_date` input labeled "วันที่เริ่ม"
- Add `end_date` input labeled "วันที่สิ้นสุด (ถ้าจองหลายวัน)"
- Auto-set `end_date = booking_date` when start changes and end is empty or less than start
- Show badge "X วัน" next to the range when > 1 day
- Keep native `<input type="date">` — no new library needed

**List views** ([my-bookings/page.tsx](../../frontend/src/app/my-bookings/page.tsx), [admin/bookings/page.tsx](../../frontend/src/app/admin/bookings/page.tsx)):

Helper:
```tsx
function formatBookingDateRange(start: string, end?: string): string {
  if (!end || end === start) return formatThaiDate(start)
  return `${formatThaiDate(start)} – ${formatThaiDate(end)}`
}
```

**Detail page** ([booking/[id]/page.tsx](../../frontend/src/app/booking/[id]/page.tsx)): similar — show range when different.

**Types** ([frontend/src/lib/api/types.ts](../../frontend/src/lib/api/types.ts)): add `end_date: string` to `Booking` and `CreateBookingRequest`.

---

## PDF updates

[backend/internal/utils/pdf.go](../../backend/internal/utils/pdf.go):

**Notice layout** (drawNoticePage, line 151-156): when `EndDate != BookingDate`, replace single-line with multiple lines matching the reference paper notices:

```
วันพุธที่ 12 กุมภาพันธ์ 2568    เวลา 08.30 - 16.30 น.
วันพฤหัสบดีที่ 13 กุมภาพันธ์ 2568    เวลา 08.30 - 16.30 น.
```

Logic:
```go
days := daysBetween(b.BookingDate.Time, b.EndDate.Time)  // inclusive
if days == 1 {
    // current single-line
} else {
    for _, d := range iterateDays(b.BookingDate.Time, b.EndDate.Time) {
        line := formatThaiFullDate(d) + "   เวลา " + timeStr
        pdf.CellFormat(0, 10, line, "", 1, "C", false, 0, "")
    }
}
```

**Report layout** (drawReportTableRows): in the วันที่ column, render "12 ก.พ. – 14 ก.พ. 2568" when range > 1 day, else current single-date.

---

## Email templates

[backend/internal/templates/email/*.html](../../backend/internal/templates/email/) — 5 files reference `{{.BookingDate}}`.

Add a helper in the template function map (likely in [backend/internal/services/email_service.go](../../backend/internal/services/email_service.go) — locate `template.FuncMap`):

```go
"formatDateRange": func(start, end time.Time) string {
    if start.Equal(end) { return formatThai(start) }
    return formatThai(start) + " – " + formatThai(end)
}
```

Templates: `{{formatDateRange .Booking.BookingDate.Time .Booking.EndDate.Time}}`.

---

## Verification

1. `go build ./...` + `go test ./...` pass
2. Restart backend → AutoMigrate adds column, backfill SQL populates existing rows
3. Create single-day booking → `end_date == booking_date`, no behavior change
4. Create 3-day booking 25–27 เม.ย. → shows "3 วัน" badge in form, PDF notice renders 3 date lines
5. Attempt conflicting booking on day 2 of existing range → `409 ห้องถูกจองในช่วงเวลานี้แล้ว`
6. Fixed schedule: set recurring Tuesday 10-12 → try booking Mon-Wed 09-13 → rejected
7. List views show "25 เม.ย. – 27 เม.ย. 2569" for range, single date for 1-day
8. Email templates render range correctly (MailHog check)
9. PDF batch (report): date column shows range compactly

Backfill SQL is idempotent (WHERE end_date IS NULL) — safe to run multiple times during dev.

---

## Rollout order (suggested commits)

1. **Schema + migration + backfill** (backend-only, non-breaking) — existing API still works because end_date defaults to booking_date
2. **Validation + conflict query** (backend-only)
3. **Form UI** (frontend — still works for single-day; end_date optional)
4. **List + detail views** (frontend)
5. **PDF + email templates** (both)
6. **Remove temporary NULL-tolerance** (make end_date NOT NULL in GORM tag)

Ship each commit independently — breaks nothing mid-rollout.

---

## Risks

1. **Existing bookings with no end_date**: mitigated by backfill SQL. Test: query `SELECT COUNT(*) FROM bookings WHERE end_date IS NULL` after migration — must be 0.
2. **Conflict query performance**: range overlap with OR and two index lookups. For the 2,000-row scale of this app it's fine; reconsider if bookings table grows past 100K rows.
3. **Timezone edge cases**: current code compares dates in UTC. Booking dates are date-only (no time-of-day), so DST doesn't affect. Safe.
4. **30-day cap is arbitrary**: set to prevent abuse. If users need longer (e.g., semester-long recurring), recommend `fixed_schedules` feature instead.
5. **PDF notice page layout with many days**: 30 days × 10mm = 300mm > A4 landscape height. Real notices rarely need more than ~5 days — design caps the visual list to the first N days with "... และอีก N วัน" if > 5. Practical limit for door-posted notices.

---

## Out of scope (future work)

- Recurring bookings (weekly/daily repeat) — use `fixed_schedules` feature
- Different time windows per day in a range
- Partial-day ranges (e.g. "afternoon only on day 3")
- Week-view / calendar UI for selecting ranges visually — the calendar view feature would be the natural place
