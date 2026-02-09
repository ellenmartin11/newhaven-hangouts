-- Migration: Move Extensions to Dedicated Schema
-- Run this in your Supabase SQL Editor

-- 1. Create the new schema for extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Move existing extensions to the new schema
-- This is the SAFE method. It updates the catalog without dropping data.
-- We move "uuid-ossp" as well since it's good practice to keep public clean.
ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
ALTER EXTENSION "postgis" SET SCHEMA extensions;

-- 3. Grant usage on the new schema to relevant roles
-- 'anon' and 'authenticated' need usage to call functions like st_distance, uuid_generate_v4
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- 4. Grant execute permissions on functions in the schema (optional but recommended)
GRANT ALL ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- 5. Update the search_path so queries can find the extensions without 'extensions.' prefix
-- We add 'extensions' to the path for all roles.
ALTER ROLE authenticated SET search_path = public, extensions;
ALTER ROLE anon SET search_path = public, extensions;
ALTER ROLE service_role SET search_path = public, extensions;
ALTER ROLE postgres SET search_path = public, extensions;

-- 6. Also update the database-level default (for new connections/roles)
ALTER DATABASE postgres SET search_path = public, extensions;

-- Verification
-- SELECT * FROM pg_extension;
-- Should show schema 'extensions' for postgis and uuid-ossp
