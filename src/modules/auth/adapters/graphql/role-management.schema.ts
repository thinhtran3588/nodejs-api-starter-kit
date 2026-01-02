export const roleManagementSchema = `
  type Role {
    id: ID!
    code: String!
    name: String!
    description: String!
    version: Int!
    createdAt: String!
    lastModifiedAt: String
    createdBy: String
    lastModifiedBy: String
  }

  type RolesResult {
    data: [Role!]!
    pagination: PaginationInfo!
  }

  input FindRolesInput {
    pageIndex: Int
    itemsPerPage: Int
    searchTerm: String
    userGroupId: String
  }

  extend type Query {
    roles(input: FindRolesInput): RolesResult!
    role(id: ID!): Role!
  }
`;
