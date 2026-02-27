import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const userStatusEnum = pgEnum('user_status', [
  'ACTIVE',
  'DISABLED',
  'DELETED',
]);

export const signInTypeEnum = pgEnum('sign_in_type', [
  'EMAIL',
  'GOOGLE',
  'APPLE',
]);

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey(),
  code: varchar('code', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  version: integer('version').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
  lastModifiedAt: timestamp('last_modified_at', { mode: 'date' }),
  createdBy: uuid('created_by'),
  lastModifiedBy: varchar('last_modified_by', { length: 255 }),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  externalId: varchar('external_id', { length: 255 }).notNull(),
  signInType: signInTypeEnum('sign_in_type').notNull(),
  displayName: varchar('display_name', { length: 255 }),
  username: varchar('username', { length: 255 }),
  status: userStatusEnum('status').notNull(),
  version: integer('version').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
  lastModifiedAt: timestamp('last_modified_at', { mode: 'date' }),
  createdBy: uuid('created_by'),
  lastModifiedBy: varchar('last_modified_by', { length: 255 }),
});

export const userGroups = pgTable('user_groups', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  version: integer('version').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
  lastModifiedAt: timestamp('last_modified_at', { mode: 'date' }),
  createdBy: uuid('created_by'),
  lastModifiedBy: varchar('last_modified_by', { length: 255 }),
});

export const userGroupUsers = pgTable(
  'user_group_users',
  {
    userGroupId: uuid('user_group_id')
      .notNull()
      .references(() => userGroups.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
    createdBy: uuid('created_by'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userGroupId, table.userId] }),
  })
);

export const userGroupRoles = pgTable(
  'user_group_roles',
  {
    userGroupId: uuid('user_group_id')
      .notNull()
      .references(() => userGroups.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
    createdBy: uuid('created_by'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userGroupId, table.roleId] }),
  })
);

export const usersPendingDeletion = pgTable('users_pending_deletion', {
  id: uuid('id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
});

export const schema = {
  roles,
  userGroupRoles,
  userGroupUsers,
  userGroups,
  users,
  usersPendingDeletion,
};
