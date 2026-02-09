-- Check current state of users table
SELECT 
    id, 
    username, 
    email,
    CASE 
        WHEN password_hash IS NULL THEN 'NULL - PROBLEM!' 
        WHEN password_hash = '' THEN 'Empty string - PROBLEM!'
        ELSE 'Has password hash - OK' 
    END as password_status,
    created_at
FROM users
ORDER BY created_at DESC;

-- If you see NULL values, run this next:
-- UPDATE users SET password_hash = '$2b$12$dummy.hash.for.existing.users.that.need.to.reset.their.password' WHERE password_hash IS NULL;
