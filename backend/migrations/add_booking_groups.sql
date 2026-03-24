-- Migration: Add booking_groups table and group_id to bookings
-- This supports multi-room booking by grouping multiple bookings together

-- Create booking_groups table
CREATE TABLE IF NOT EXISTS booking_groups (
    group_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add index on user_id
CREATE INDEX IF NOT EXISTS idx_booking_groups_user_id ON booking_groups(user_id);

-- Add group_id column to bookings table (nullable for backward compatibility)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES booking_groups(group_id);

-- Add index on group_id
CREATE INDEX IF NOT EXISTS idx_bookings_group_id ON bookings(group_id);
