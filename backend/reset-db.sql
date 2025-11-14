-- Drop all tables and types to start fresh
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO poker_user;
GRANT ALL ON SCHEMA public TO public;
