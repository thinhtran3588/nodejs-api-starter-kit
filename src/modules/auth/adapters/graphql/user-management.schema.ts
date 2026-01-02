export const userManagementSchema = `
  type User {
    id: ID!
    email: String!
    signInType: SignInType!
    externalId: String!
    displayName: String
    username: String
    status: UserStatus!
    version: Int!
    createdAt: String!
    lastModifiedAt: String
    createdBy: String
    lastModifiedBy: String
  }

  type UsersResult {
    data: [User!]!
    pagination: PaginationInfo!
  }

  input UpdateUserManagementInput {
    displayName: String
    username: String
  }

  input ToggleUserStatusInput {
    enabled: Boolean!
  }

  input FindUsersInput {
    pageIndex: Int
    itemsPerPage: Int
    searchTerm: String
    userGroupId: String
  }

  input AddUserToUserGroupInput {
    userGroupId: ID!
  }

  input RemoveUserFromUserGroupInput {
    userGroupId: ID!
  }

  extend type Query {
    users(input: FindUsersInput): UsersResult!
    user(id: ID!): User!
  }

  type UserManagementMutation {
    updateUser(id: ID!, input: UpdateUserManagementInput!): Boolean!
    toggleUserStatus(id: ID!, input: ToggleUserStatusInput!): Boolean!
    deleteUser(id: ID!): Boolean!
    addUserToUserGroup(id: ID!, input: AddUserToUserGroupInput!): Boolean!
    removeUserFromUserGroup(id: ID!, input: RemoveUserFromUserGroupInput!): Boolean!
  }

  extend type Mutation {
    users: UserManagementMutation!
  }
`;
