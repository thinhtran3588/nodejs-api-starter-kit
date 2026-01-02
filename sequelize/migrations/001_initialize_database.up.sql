-- ============================================
-- Initialize Database Schema
-- Creates all tables, enums, and indexes
-- ============================================

-- Enable unaccent extension for Vietnamese text search
-- This allows searching "tam" to match "tâm", "tấm", "tẩm", etc.
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Create immutable wrapper function for unaccent()
-- PostgreSQL requires generated columns to use only immutable functions
-- unaccent() is not marked as immutable by default, so we create a wrapper
CREATE OR REPLACE FUNCTION unaccent_immutable(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT unaccent($1);
$$;

-- Create enum types
DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('ACTIVE', 'DISABLED', 'DELETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE sign_in_type AS ENUM ('EMAIL', 'GOOGLE', 'APPLE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID NOT NULL PRIMARY KEY,
  code VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  version INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL,
  last_modified_at TIMESTAMP,
  created_by UUID,
  last_modified_by VARCHAR(255),
  -- Full-text search vector column (generated)
  -- We use 'simple' dictionary (no stemming) for exact/partial matching
  -- unaccent_immutable() removes Vietnamese accents for efficient searching
  -- Example: searching "tam" will match "tâm", "tấm", "tẩm", etc.
  -- Weights: A=code and name (highest), B=description (lower)
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', unaccent_immutable(COALESCE(code, ''))), 'A') ||
    setweight(to_tsvector('simple', unaccent_immutable(COALESCE(name, ''))), 'A') ||
    setweight(to_tsvector('simple', unaccent_immutable(COALESCE(description, ''))), 'B')
  ) STORED
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  external_id VARCHAR(255) NOT NULL UNIQUE,
  sign_in_type sign_in_type NOT NULL,
  display_name VARCHAR(255),
  username VARCHAR(255) UNIQUE,
  status user_status NOT NULL,
  version INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL,
  last_modified_at TIMESTAMP,
  created_by UUID,
  last_modified_by VARCHAR(255),
  -- Full-text search vector column (generated)
  -- We use 'simple' dictionary (no stemming) for exact/partial matching
  -- unaccent_immutable() removes Vietnamese accents for efficient searching
  -- Example: searching "tam" will match "tâm", "tấm", "tẩm", etc.
  -- Weights: A=email (highest), B=displayName, C=username (lowest)
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', unaccent_immutable(COALESCE(email, ''))), 'A') ||
    setweight(to_tsvector('simple', unaccent_immutable(COALESCE(display_name, ''))), 'B') ||
    setweight(to_tsvector('simple', unaccent_immutable(COALESCE(username, ''))), 'C')
  ) STORED
);

-- Create user_groups table
CREATE TABLE IF NOT EXISTS user_groups (
  id UUID NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  version INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL,
  last_modified_at TIMESTAMP,
  created_by UUID,
  last_modified_by VARCHAR(255),
  -- Full-text search vector column (generated)
  -- We use 'simple' dictionary (no stemming) for exact/partial matching
  -- unaccent_immutable() removes Vietnamese accents for efficient searching
  -- Example: searching "tam" will match "tâm", "tấm", "tẩm", etc.
  -- Weights: A=name (highest), B=description (lower)
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', unaccent_immutable(COALESCE(name, ''))), 'A') ||
    setweight(to_tsvector('simple', unaccent_immutable(COALESCE(description, ''))), 'B')
  ) STORED
);

-- Create junction table for UserGroup -> User relationship
CREATE TABLE IF NOT EXISTS user_group_users (
  user_group_id UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL,
  created_by UUID,
  PRIMARY KEY (user_group_id, user_id)
);

-- Create junction table for UserGroup -> Role relationship
CREATE TABLE IF NOT EXISTS user_group_roles (
  user_group_id UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL,
  created_by UUID,
  PRIMARY KEY (user_group_id, role_id)
);

-- Create table for users pending deletion
-- This table tracks users that have been marked for deletion and are waiting for actual deletion by a background job
CREATE TABLE IF NOT EXISTS users_pending_deletion (
  id UUID NOT NULL PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
);

-- Create domain_events table
-- This table stores domain events raised by aggregates for event sourcing and event-driven architecture
CREATE TABLE IF NOT EXISTS domain_events (
  id UUID NOT NULL PRIMARY KEY,
  aggregate_id UUID NOT NULL,
  aggregate_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL,
  created_by UUID,
  metadata JSONB
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS users_sign_in_type_index ON users(sign_in_type);
CREATE INDEX IF NOT EXISTS idx_user_group_users_user_id ON user_group_users(user_id);
CREATE INDEX IF NOT EXISTS idx_user_group_roles_role_id ON user_group_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_group_users_group_id ON user_group_users(user_group_id);
CREATE INDEX IF NOT EXISTS idx_user_group_roles_group_id ON user_group_roles(user_group_id);

-- Full-text search indexes for users
CREATE INDEX IF NOT EXISTS idx_users_search_vector ON users USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_users_status_search ON users(status);

-- Full-text search indexes for roles
CREATE INDEX IF NOT EXISTS idx_roles_search_vector ON roles USING GIN(search_vector);

-- Full-text search indexes for user_groups
CREATE INDEX IF NOT EXISTS idx_user_groups_search_vector ON user_groups USING GIN(search_vector);

-- Indexes for domain_events table
CREATE INDEX IF NOT EXISTS idx_domain_events_aggregate_id ON domain_events(aggregate_id);
CREATE INDEX IF NOT EXISTS idx_domain_events_aggregate_name ON domain_events(aggregate_name);
CREATE INDEX IF NOT EXISTS idx_domain_events_event_type ON domain_events(event_type);
CREATE INDEX IF NOT EXISTS idx_domain_events_created_at ON domain_events(created_at);
