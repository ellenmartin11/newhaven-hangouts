-- Migration: Safely Reinstall PostGIS to 'extensions' Schema with Data Backup
-- Run this in Supabase SQL Editor to fix the "permission denied" or "does not support SET SCHEMA" errors.

BEGIN;

-- 1. Create a backup of the geometry data
-- We convert to EWKB (Enhanced Well-Known Binary) to store it as raw bytes
-- This allows us to keep the data even when the 'geometry' type is dropped
CREATE TABLE IF NOT EXISTS checkins_geom_backup AS 
SELECT id, ST_AsEWKB(geom) as geom_data FROM checkins;

-- 2. Drop the extensions (This is destructive to columns using these types!)
-- This drops the 'geom' column from 'checkins' and the default values from 'id' columns
DROP EXTENSION IF EXISTS postgis CASCADE;
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- 3. Create the new schema and reinstall extensions
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION postgis WITH SCHEMA extensions;
CREATE EXTENSION "uuid-ossp" WITH SCHEMA extensions;

-- 4. Restore the 'geom' column in 'checkins'
ALTER TABLE checkins ADD COLUMN geom geometry(Point, 4326);

-- 5. Restore the data from backup
UPDATE checkins c 
SET geom = (SELECT ST_GeomFromEWKB(b.geom_data) FROM checkins_geom_backup b WHERE b.id = c.id);

-- 6. Enforce constraints and indexes
ALTER TABLE checkins ALTER COLUMN geom SET NOT NULL;
CREATE INDEX idx_checkins_geom ON checkins USING GIST(geom);

-- 7. Restore default values for Primary Keys (uuid_generate_v4 was dropped)
-- We must explicitly reference the function in the new 'extensions' schema
ALTER TABLE users ALTER COLUMN id SET DEFAULT extensions.uuid_generate_v4();
ALTER TABLE checkins ALTER COLUMN id SET DEFAULT extensions.uuid_generate_v4();

-- 8. Clean up backup
DROP TABLE checkins_geom_backup;

-- 9. Update search_path for all roles to include 'extensions'
ALTER ROLE authenticated SET search_path = public, extensions;
ALTER ROLE anon SET search_path = public, extensions;
ALTER ROLE service_role SET search_path = public, extensions;
ALTER ROLE postgres SET search_path = public, extensions;
ALTER DATABASE postgres SET search_path = public, extensions;

COMMIT;

-- Verify
-- SELECT * FROM pg_extension;
-- SELECT Count(*) FROM checkins;
