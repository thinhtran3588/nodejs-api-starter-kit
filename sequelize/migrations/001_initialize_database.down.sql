-- ============================================
-- Rollback Database Schema
-- Drops all tables, indexes, and enums
-- ============================================

-- Drop indexes
DROP INDEX IF EXISTS idx_domain_events_created_at;
DROP INDEX IF EXISTS idx_domain_events_event_type;
DROP INDEX IF EXISTS idx_domain_events_aggregate_name;
DROP INDEX IF EXISTS idx_domain_events_aggregate_id;
DROP INDEX IF EXISTS idx_user_groups_search_vector;
DROP INDEX IF EXISTS idx_roles_search_vector;
DROP INDEX IF EXISTS idx_users_status_search;
DROP INDEX IF EXISTS idx_users_search_vector;
DROP INDEX IF EXISTS idx_user_group_roles_group_id;
DROP INDEX IF EXISTS idx_user_group_users_group_id;
DROP INDEX IF EXISTS idx_user_group_roles_role_id;
DROP INDEX IF EXISTS idx_user_group_users_user_id;
DROP INDEX IF EXISTS users_sign_in_type_index;

-- Drop junction tables
DROP TABLE IF EXISTS user_group_roles;
DROP TABLE IF EXISTS user_group_users;

-- Drop pending deletion table
DROP TABLE IF EXISTS users_pending_deletion;

-- Drop domain events table
DROP TABLE IF EXISTS domain_events;

-- Drop main tables
DROP TABLE IF EXISTS user_groups;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- Drop enum types
DROP TYPE IF EXISTS sign_in_type;
DROP TYPE IF EXISTS user_status;

-- Drop the immutable wrapper function
DROP FUNCTION IF EXISTS unaccent_immutable(text);

-- Note: We don't drop the unaccent extension as it might be used by other parts of the system
-- If you need to drop it, run: DROP EXTENSION IF EXISTS unaccent;

