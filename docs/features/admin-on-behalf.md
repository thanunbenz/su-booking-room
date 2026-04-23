# Admin Booking on Behalf of Others

Admins can create a booking for any user. The target user becomes the owner — they receive email notifications, see it in "รายการจองของฉัน", and can cancel it.

---

## Authorization

Enforced server-side in [backend/internal/handlers/booking_handler.go](../../backend/internal/handlers/booking_handler.go) `Create`:

```go
if isAdmin && input.UserID > 0 {
    // verify target user exists, keep input.UserID
} else {
    input.UserID = int(userID) // force own
}
```

Non-admins cannot spoof — even if a regular user POSTs `{"user_id": 999, ...}`, the backend overwrites it with their JWT user. Only admins with `role_id = 1` can override.

---

## API

### `POST /api/v1/bookings` (with admin JWT)

```json
{
  "user_id": 6,
  "room_id": 33,
  "title": "จองแทน teacher2",
  "booking_date": "2026-07-04",
  "start_time": "14:00",
  "end_time": "15:00"
}
```

| Response | Meaning |
|----------|---------|
| `201` | Booking created with `user_id = 6` as owner |
| `400 ผู้ใช้ที่ระบุไม่พบในระบบ` | Target user doesn't exist |
| `409 ...` | Normal conflict rules apply (same as self-booking) |

Admin who omits `user_id` (or sends `0`) books in their own name — no change from prior behavior.

---

## UI

[frontend/src/app/booking/page.tsx](../../frontend/src/app/booking/page.tsx) renders a "จองในนามของ" selector above the date inputs, visible only when `user.role.role_name === 'admin'`. The list is populated from `userApi.getAll()` on page load.

```
จองในนามของ  (Admin เท่านั้น — ไม่เลือก = จองในนามตัวเอง)
[ — จองในนามตัวเอง —                    ▾ ]
  Admin Silpakorn (admin@silpakorn.edu)
  Teacher One (teacher1@silpakorn.edu)
  ...
```

The selected user's `user_id` is sent in the POST body only when > 0; otherwise the field is omitted entirely so non-admin workflows remain untouched.

---

## Notification behavior

The notification fires for the **target user**, not the admin. Email goes to `target.email`, in-app notification records `user_id = target.user_id`. This is a direct consequence of `booking.UserID` being the owner — notifications already follow that.

---

## Audit

There is **no explicit audit log** indicating which admin created the booking — the `created_at` / `created_by` distinction is not tracked. If audit is needed later, add an `acting_user_id` column populated from the JWT user.
