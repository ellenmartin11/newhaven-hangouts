-- Migration: Force Move PostGIS to Dedicated Schema
-- Use this to fix the "extension does not support SET SCHEMA" error

-- 1. Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Allow PostGIS to be moved
-- WORKAROUND: PostGIS sometimes reports it cannot be moved. 
-- We update the system catalog to explicitly allow it.
UPDATE pg_extension 
SET extrelocatable = true 
WHERE extname = 'postgis';

-- 3. Move the extensions now that it's allowed
ALTER EXTENSION "postgis" SET SCHEMA extensions;

-- 4. Move uuid-ossp (if it wasn't moved already)
-- Note: If this line fails with "already in schema extensions", that is fine!
ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;

-- 5. Restore permissions
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- 6. Ensure search_path is correct for all roles
ALTER ROLE authenticated SET search_path = public, extensions;
ALTER ROLE anon SET search_path = public, extensions;
ALTER ROLE service_role SET search_path = public, extensions;
ALTER ROLE postgres SET search_path = public, extensions;
ALTER DATABASE postgres SET search_path = public, extensions;

-- 7. (Optional) Set PostGIS back to not relocatable (to match default state)
-- UPDATE pg_extension SET extrelocatable = false WHERE extname = 'postgis';
