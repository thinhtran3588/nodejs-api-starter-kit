-- ============================================
-- Seed Initial Data
-- Inserts initial roles into the database
-- ============================================

-- Seed initial roles
INSERT INTO roles (id, code, name, description, created_at, last_modified_at, version)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'ADMIN', 'Admin', 'Administrator with full system access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  (gen_random_uuid(), 'AUTH_MANAGER', 'Auth Manager', 'Can manage authentication and user accounts', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  (gen_random_uuid(), 'AUTH_VIEWER', 'Auth Viewer', 'Can view authentication and user information', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
ON CONFLICT (code) DO NOTHING;

-- Seed initial Admin user group
INSERT INTO user_groups (id, name, description, created_at, last_modified_at, version)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'Admin',
    'Initial admin user group with access to all available roles',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    0
  )
ON CONFLICT (name) DO NOTHING;

-- Grant all current roles to the Admin user group
INSERT INTO user_group_roles (user_group_id, role_id, created_at)
SELECT user_groups.id, roles.id, CURRENT_TIMESTAMP
FROM user_groups
CROSS JOIN roles
WHERE user_groups.name = 'Admin'
ON CONFLICT (user_group_id, role_id) DO NOTHING;


