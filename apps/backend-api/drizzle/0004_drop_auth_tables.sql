-- Drop all Better-Auth tables to let Better-Auth recreate them automatically
DROP TABLE IF EXISTS verification CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS session CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- Better-Auth will automatically create these tables with the correct schema
-- when the server starts up
