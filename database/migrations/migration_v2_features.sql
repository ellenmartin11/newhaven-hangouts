-- Migration: Add visibility features to checkins
-- Run this in Supabase SQL Editor

-- 1. Add visibility column (enum emulation via check constraint)
ALTER TABLE checkins 
ADD COLUMN visibility text DEFAULT 'everyone' CHECK (visibility IN ('everyone', 'specific'));

-- 2. Add share_with column (array of user UUIDs)
ALTER TABLE checkins 
ADD COLUMN share_with uuid[] DEFAULT NULL;

-- 3. Comment explaining usage
COMMENT ON COLUMN checkins.visibility IS 'Who can see this checkin: "everyone" (friends) or "specific" (subset of friends)';
COMMENT ON COLUMN checkins.share_with IS 'List of friend UUIDs who can see this if visibility is "specific"';
