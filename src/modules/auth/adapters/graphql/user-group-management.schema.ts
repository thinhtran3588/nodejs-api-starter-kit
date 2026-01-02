export const userGroupManagementSchema = `
  type UserGroup {
    id: ID!
    name: String!
    description: String
    version: Int!
    createdAt: String!
    lastModifiedAt: String
    createdBy: String
    lastModifiedBy: String
  }

  type UserGroupsResult {
    data: [UserGroup!]!
    pagination: PaginationInfo!
  }

  input CreateUserGroupInput {
    name: String!
    description: String
  }

  input UpdateUserGroupInput {
    name: String
    description: String
  }

  input FindUserGroupsInput {
    pageIndex: Int
    itemsPerPage: Int
    searchTerm: String
  }

  input AddRoleToUserGroupInput {
    roleId: String!
  }

  input RemoveRoleFromUserGroupInput {
    roleId: String!
  }

  extend type Query {
    userGroups(input: FindUserGroupsInput): UserGroupsResult!
    userGroup(id: ID!): UserGroup!
  }

  type CreateUserGroupResult {
    id: ID!
  }

  type UserGroupManagementMutation {
    createUserGroup(input: CreateUserGroupInput!): CreateUserGroupResult!
    updateUserGroup(id: ID!, input: UpdateUserGroupInput!): Boolean!
    deleteUserGroup(id: ID!): Boolean!
    addRoleToUserGroup(userGroupId: ID!, input: AddRoleToUserGroupInput!): Boolean!
    removeRoleFromUserGroup(userGroupId: ID!, input: RemoveRoleFromUserGroupInput!): Boolean!
  }

  extend type Mutation {
    userGroups: UserGroupManagementMutation!
  }
`;
