# SMTP Email Service

SMTP-based email service for SU Booking Room with async queue processing, worker pool, retry mechanism, and HTML templates.

---

## Architecture

```
Booking Handler
    |
    v
NotificationService          ReminderService (cron @hourly)
    |                             |
    +--> Create DB record         +--> Check upcoming bookings
    +--> Prepare template data    +--> Send reminders (24h before)
    |
    v
EmailService
    |
    +--> Job Queue (configurable, default 100)
    +--> Worker Pool (configurable, default 3)
    +--> SMTP Dialer (gomail.v2)
    +--> Retry on failure (configurable, default 3x with 5s delay)
```

**Key files:**

| File | Purpose |
|------|---------|
| `backend/internal/config/smtp.go` | SMTP configuration from env vars |
| `backend/internal/services/email_service.go` | Queue, workers, SMTP sending |
| `backend/internal/services/notification_service.go` | Booking notification logic |
| `backend/internal/services/reminder_service.go` | Cron-based reminder job |
| `backend/internal/handlers/notification_handler.go` | API endpoints |
| `backend/internal/templates/email/*.html` | HTML email templates |
| `backend/internal/models/notification.go` | Database model |

---

## Environment Variables

### SMTP Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SMTP_ENABLED` | `true` | Enable/disable email sending |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_USERNAME` | _(empty)_ | SMTP auth username |
| `SMTP_PASSWORD` | _(empty)_ | SMTP auth password |
| `SMTP_FROM` | `SU Booking Room <noreply@silpakorn.edu>` | Sender address |

### Queue and Worker Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `EMAIL_QUEUE_SIZE` | `100` | Max pending email jobs in queue |
| `EMAIL_WORKER_COUNT` | `3` | Concurrent email sending workers |
| `EMAIL_RETRY_COUNT` | `3` | Retry attempts on failure |
| `EMAIL_RETRY_DELAY` | `5s` | Delay between retries |

### Other

| Variable | Default | Description |
|----------|---------|-------------|
| `REMINDER_ENABLED` | `true` | Enable booking reminder cron |
| `APP_BASE_URL` | `http://localhost:3000` | Base URL for links in emails |

### Development (MailHog)

```env
SMTP_ENABLED=true
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USERNAME=
SMTP_PASSWORD=
```

Start MailHog: `docker-compose up -d mailhog` -- Web UI at `http://localhost:8025`

### Production (Gmail)

```env
SMTP_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

---

## API Endpoints

**Base URL:** `http://localhost:8000/api/v1`

**Auth header:** `Authorization: Bearer <JWT_TOKEN>`

### User Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications/my` | JWT | Get own notifications |
| PATCH | `/notifications/:id/read` | JWT | Mark as read |
| PATCH | `/notifications/read-all` | JWT | Mark all as read |
| DELETE | `/notifications/:id` | JWT | Delete notification |

### Admin Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications/settings` | Admin | Email service status and templates |
| POST | `/notifications/test-email` | Admin | Send a test email |

### GET /notifications/settings

Returns email service queue status and available templates.

**Response:**

```json
{
  "success": true,
  "data": {
    "email_service": {
      "queue_size": 0,
      "queue_capacity": 100,
      "workers": 3,
      "enabled": true
    },
    "templates": [
      "booking_created",
      "booking_approved",
      "booking_rejected",
      "booking_cancelled",
      "booking_reminder"
    ]
  },
  "message": "Notification settings retrieved"
}
```

### POST /notifications/test-email

Send a test email to verify SMTP configuration.

**Request body:**

```json
{
  "to": "recipient@example.com",
  "subject": "Test Email",
  "message": "Custom test message"
}
```

Only `to` is required. `subject` and `message` have defaults.

**Response:**

```json
{
  "success": true,
  "data": {
    "to": "recipient@example.com",
    "subject": "Test Email",
    "status": "queued"
  },
  "message": "Test email queued successfully"
}
```

---

## Email Templates

Templates are located at `backend/internal/templates/email/` and use Go `html/template` syntax.

### Available Templates

| Template | Event | Description |
|----------|-------|-------------|
| `booking_created.html` | New booking | Confirmation with booking details |
| `booking_approved.html` | Admin approves | Approval notification |
| `booking_rejected.html` | Admin rejects | Rejection with reason |
| `booking_cancelled.html` | User cancels | Cancellation confirmation |
| `booking_reminder.html` | 24h before | Upcoming booking reminder |

### Template Variables

All templates receive these variables:

| Variable | Type | Example |
|----------|------|---------|
| `UserName` | string | `"John Doe"` |
| `BookingID` | int | `42` |
| `RoomName` | string | `"CS Lab 1"` |
| `BuildingName` | string | `"IT Building"` |
| `Title` | string | `"Database Lecture"` |
| `BookingDate` | string | `"15 March 2026"` |
| `StartTime` | string | `"09:00"` |
| `EndTime` | string | `"12:00"` |
| `Status` | string | `"approved"` |
| `StatusText` | string | `"Approved"` |
| `StatusNote` | string | `"Reason text"` |
| `ViewBookingURL` | string | `"http://localhost:3000/my-bookings"` |
| `BookNewURL` | string | `"http://localhost:3000/booking"` |
| `CancelBookingURL` | string | `"http://localhost:3000/my-bookings"` |

### Customizing Templates

1. Edit the HTML file in `backend/internal/templates/email/`
2. Use Go template syntax: `{{.VariableName}}`
3. Conditionals: `{{if eq .Status "approved"}}...{{end}}`
4. Restart the backend to reload templates

To add new variables, update `prepareEmailData()` in `notification_service.go`.

---

## Frontend Integration

### Admin Notifications Page

Available at `/admin/notifications` (admin only). Provides:

- Email service status (enabled, workers, queue usage)
- List of available email templates
- Test email form to verify SMTP configuration

### API Client

Use `notificationApi` from `@/lib/api/client`:

```typescript
import { notificationApi } from '@/lib/api/client';

// Get settings (admin)
const settings = await notificationApi.getSettings();

// Send test email (admin)
await notificationApi.sendTestEmail({ to: 'test@example.com' });

// Get user notifications
const notifs = await notificationApi.getMyNotifications({ limit: 20 });

// Mark as read
await notificationApi.markAsRead(notificationId);

// Mark all as read
await notificationApi.markAllAsRead();
```

### Sidebar

The admin sidebar includes a "Notifications" link under the admin section, visible only to admin users.

---

## Troubleshooting

### Email not sending

1. Check SMTP is enabled: look for `SMTP Config loaded` in backend logs
2. Verify MailHog is running: `docker ps | grep mailhog`
3. Check SMTP host and port match your provider
4. Look for error logs: `SMTP send failed` or `Failed to queue email`

### Queue full error

```
email queue is full, timeout after 5s
```

Increase `EMAIL_QUEUE_SIZE` or `EMAIL_WORKER_COUNT` in `.env`.

### SMTP connection refused

```
SMTP send failed: dial tcp: connection refused
```

- MailHog: ensure `docker-compose up -d mailhog` is running
- Gmail: verify `SMTP_HOST=smtp.gmail.com` and `SMTP_PORT=587`
- Gmail requires an App Password (not regular password)

### Templates not rendering

If templates fail to load, the service falls back to a basic HTML template. Check logs for `Failed to load email templates` and verify files exist in `backend/internal/templates/email/`.

---

Last Updated: 2026-03-24
