-- Migration: Update profiles table with new fields
-- Add location, timezone, phone_numbers, core_values, profile_image_url

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS location VARCHAR(255),
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS phone_numbers TEXT[],
  ADD COLUMN IF NOT EXISTS core_values TEXT[],
  ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Add password reset fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_reset_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS email_change_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS email_change_new_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email_change_expires_at TIMESTAMP;
