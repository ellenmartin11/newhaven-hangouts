-- Migration: Enable Row Level Security (RLS)
-- Run this in your Supabase SQL Editor to resolve "RLS Disabled in Public" warnings

-- Enable RLS on all sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
-- Note: 'spatial_ref_sys' is a PostGIS system table, usually safe to leave as-is or enable RLS if required.

-- IMPORTANT: 
-- By default, enabling RLS blocks ALL access via the 'anon' (public) API key.
-- Since your app logic runs on the backend server using the internal client, 
-- ensure your backend is using the SERVICE_ROLE key (which bypasses RLS) 
-- OR create appropriate access policies if you are using the Anon key.

-- Example Policy (Only if using Anon Key - NOT RECOMMENDED for backend-only logic):
-- CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
