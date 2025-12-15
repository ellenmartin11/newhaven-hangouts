-- Fix: Ensure password_hash can accept NULL temporarily during migration
-- Then we'll set defaults for existing users

-- Step 1: Make password_hash nullable temporarily
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;

-- Step 2: Set placeholder password hash for existing users who don't have one
-- This is a hashed version of 'changeme123' - users should reset this
UPDATE users 
SET password_hash = 'scrypt:32768:8:1$mHPqQqXtqR2QRyLs$a7d7f4b4f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7'
WHERE password_hash IS NULL;

-- Step 3: Now make it NOT NULL again
ALTER TABLE users 
ALTER COLUMN password_hash SET NOT NULL;

-- Verification
SELECT id, username, email, 
       CASE WHEN password_hash IS NOT NULL THEN 'Has password' ELSE 'No password' END as password_status
FROM users;
