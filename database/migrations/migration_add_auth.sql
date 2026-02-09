-- Migration: Add Email Authentication to Existing Database
-- Run this in your Supabase SQL Editor

-- Step 1: Add email and password_hash columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Step 2: Update existing users with placeholder emails (you can update these later)
-- This ensures existing users have valid email addresses
UPDATE users 
SET email = username || '@placeholder.com'
WHERE email IS NULL;

-- Step 3: Set the columns as NOT NULL after filling them
ALTER TABLE users 
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN password_hash SET NOT NULL;

-- Step 4: Add unique constraint to email
ALTER TABLE users 
ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Step 5: Remove unique constraint from username (optional - keeps existing constraint)
-- If you want username to not be unique anymore, uncomment the line below:
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;

-- Verification: Check the updated schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;
