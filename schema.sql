-- New Haven Hangouts Database Schema
-- Ensure PostGIS extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE,
    phone TEXT,
    fcm_token TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Friendships table
CREATE TABLE friendships (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- Check-ins table with PostGIS geometry
CREATE TABLE checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location_name TEXT NOT NULL,
    geom GEOMETRY(POINT, 4326) NOT NULL,
    message TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create spatial index for efficient location queries
CREATE INDEX idx_checkins_geom ON checkins USING GIST(geom);

-- Index for filtering active check-ins
CREATE INDEX idx_checkins_expires_at ON checkins(expires_at);

-- Attendees table
CREATE TABLE attendees (
    checkin_id UUID NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'coming', -- 'coming'
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (checkin_id, user_id)
);

-- Sample data for testing (optional)
-- INSERT INTO users (username, phone) VALUES 
--   ('Ellen', '+1234567890'),
--   ('Sam', '+1234567891'),
--   ('Jordan', '+1234567892');

-- -- Create some friendships
-- INSERT INTO friendships (user_id, friend_id, status) 
-- SELECT u1.id, u2.id, 'accepted'
-- FROM users u1, users u2
-- WHERE u1.username = 'Ellen' AND u2.username IN ('Sam', 'Jordan');
