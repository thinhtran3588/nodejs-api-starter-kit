/**
 * GraphQL configuration
 */
export function graphqlConfig() {
  return {
    endpoint: process.env['GRAPHQL_ENDPOINT'] ?? '/graphql',
  };
}

/**
 * GraphiQL UI configuration
 */
export function graphiqlConfig() {
  return {
    routePrefix: process.env['GRAPHQL_UI_ROUTE_PREFIX'] ?? '/graphiql',
    endpoint: process.env['GRAPHQL_ENDPOINT'] ?? '/graphql',
  };
}
