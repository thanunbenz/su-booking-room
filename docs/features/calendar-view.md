# Calendar View

Month grid showing all bookings at a glance. Accessible to every authenticated user at `/calendar`.

---

## API

### `GET /api/v1/bookings/public-calendar?from=YYYY-MM-DD&to=YYYY-MM-DD[&room_id=N]`

**Public — no auth required.** Returns only approved bookings with user PII stripped (no fullname, email, user_id, detail, equipment_request, status_note). Designed for anonymous visitors to view room occupancy without exposing booker identity.

Response shape (`PublicCalendarBooking`):

```json
{
  "booking_id": 37,
  "room_id": 33,
  "room_name": "ห้อง 101",
  "building_id": 14,
  "title": "จองแทน teacher2",
  "booking_date": "2026-07-04",
  "end_date": "2026-07-04",
  "start_time": "14:00:00",
  "end_time": "15:00:00",
  "status": "approved"
}
```

Range filter uses overlap semantics — `booking_date <= :to AND end_date >= :from` — so multi-day bookings that start before the window or end after it are correctly included.

### `GET /api/v1/bookings/` (admin-only)

Returns full booking data including user fields. Used by the admin bookings page and for full-data batch PDF. **Locked down**: requires `AuthMiddleware + AdminOnly`. Not used by the public calendar.

---

## Frontend

[frontend/src/app/calendar/page.tsx](../../frontend/src/app/calendar/page.tsx). Built with plain React + Tailwind — no calendar library installed (keeps the bundle lean; requirements are simple).

### Features

- **6 × 7 grid** covering the full visible month (42 cells including padding days from adjacent months)
- **Prev / Next / วันนี้** navigation
- **Room filter** dropdown
- **Status colors**: teal (approved), amber (pending), gray (rejected/cancelled), dark teal (completed)
- **Up to 3 events shown per cell** with "+N เพิ่มเติม" indicator
- **Click any day** to open a side panel listing all bookings (time-sorted) with status badge, room, user, and link to detail
- **Multi-day aware**: a 3-day booking appears in all three day cells and is labelled with its full range in the side panel

### Date handling quirk

ISO date strings like `"2026-04-25"` must be parsed as **local dates**, not UTC — `new Date("2026-04-25")` is parsed as UTC midnight, which shifts by one day in some timezones. The page uses a `parseDateOnly()` helper that splits on `-` and passes y/m/d to the `Date` constructor for local interpretation. When comparing dates, the page compares ISO strings (`YYYY-MM-DD`) rather than `Date.getTime()` to sidestep timezone math.

### Fetch pattern

Refetches on month change or room filter change. Uses `from/to = first/last cell of the visible grid` so a booking ending in the padding days is still shown. The fetch is cancel-on-unmount safe via a `cancelled` flag.

---

## Navigation

Sidebar link in [Sidebar.tsx](../../frontend/src/components/layout/Sidebar.tsx) — shown to everyone (anonymous visitors included):

```tsx
<Link href="/calendar"> <TbCalendarMonth /> ปฏิทิน </Link>
```

---

## Future enhancements

- **Week view** — for higher-density schedules
- **Drag to create** — click-and-drag on empty days to pre-fill the create form
- **Room swimlane view** — rows = rooms, columns = hours/days; useful for coordinating multiple rooms at once
- **Export visible month to PDF** — reuse the existing report PDF endpoint with `?from=&to=` filter
