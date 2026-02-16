-- Fix start_time and end_time column types from timestamp to time
-- Run this migration to fix the booking time columns

BEGIN;

-- Change start_time column type from timestamp to time
ALTER TABLE bookings
ALTER COLUMN start_time TYPE TIME USING start_time::TIME;

-- Change end_time column type from timestamp to time
ALTER TABLE bookings
ALTER COLUMN end_time TYPE TIME USING end_time::TIME;

-- Change booking_date column type to date (if needed)
ALTER TABLE bookings
ALTER COLUMN booking_date TYPE DATE USING booking_date::DATE;

COMMIT;

-- Verify the changes
\d bookings;
