-- ============================================
-- Rollback Initial Data
-- Removes seeded roles from the database
-- ============================================

-- Remove initial roles
DELETE FROM roles WHERE code IN ('ADMIN', 'AUTH_MANAGER', 'AUTH_VIEWER');
