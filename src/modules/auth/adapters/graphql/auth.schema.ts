export const authSchema = `
  enum SignInType {
    EMAIL
    GOOGLE
    APPLE
  }

  enum UserStatus {
    ACTIVE
    DISABLED
    DELETED
  }

  type UserProfile {
    id: ID!
    email: String!
    signInType: SignInType!
    externalId: String!
    displayName: String
    username: String
    version: Int!
    createdAt: String!
  }

  input RegisterInput {
    email: String!
    password: String!
    displayName: String
    username: String
  }

  input SignInInput {
    emailOrUsername: String!
    password: String!
  }

  input UpdateUserInput {
    displayName: String
    username: String
  }

  type AuthResponse {
    id: ID!
    idToken: String!
    signInToken: String!
  }

  type AccessTokenResponse {
    token: String!
  }

  extend type Query {
    me: UserProfile!
  }

  type AuthMutation {
    register(input: RegisterInput!): AuthResponse!
    signIn(input: SignInInput!): AuthResponse!
    updateProfile(input: UpdateUserInput!): Boolean!
    deleteAccount: Boolean!
    requestAccessToken(idToken: String!): AccessTokenResponse!
  }

  extend type Mutation {
    auth: AuthMutation!
  }
`;
