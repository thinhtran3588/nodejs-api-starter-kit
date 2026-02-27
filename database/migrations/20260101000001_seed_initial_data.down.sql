-- ============================================
-- Rollback Initial Data
-- Removes seeded user group and roles from the database
-- ============================================

-- Remove initial Admin user group
DELETE FROM user_groups WHERE name = 'Admin';

-- Remove initial roles
DELETE FROM roles WHERE code IN ('ADMIN', 'AUTH_MANAGER', 'AUTH_VIEWER');

