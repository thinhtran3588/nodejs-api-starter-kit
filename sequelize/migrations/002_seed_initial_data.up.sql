-- ============================================
-- Seed Initial Data
-- Inserts initial roles into the database
-- ============================================

-- Seed initial roles
INSERT INTO roles (id, code, name, description, created_at, last_modified_at, version)
VALUES
  (gen_random_uuid(), 'ADMIN', 'Admin', 'Administrator with full system access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  (gen_random_uuid(), 'AUTH_MANAGER', 'Auth Manager', 'Can manage authentication and user accounts', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  (gen_random_uuid(), 'AUTH_VIEWER', 'Auth Viewer', 'Can view authentication and user information', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
ON CONFLICT (code) DO NOTHING;


