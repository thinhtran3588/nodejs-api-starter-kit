import { literal } from 'sequelize';

/**
 * Configuration for full-text search
 */
export interface FullTextSearchConfig {
  /**
   * The name of the search_vector column in the database
   * @default 'search_vector'
   */
  searchVectorColumn?: string;
  /**
   * The PostgreSQL text search dictionary to use
   * @default 'simple'
   */
  dictionary?: string;
}

/**
 * Result of building a full-text search query
 */
export interface FullTextSearchResult {
  /**
   * The search condition to use in WHERE clause
   * Returns undefined if searchTerm is empty or invalid
   */
  searchCondition: ReturnType<typeof literal> | undefined;
  /**
   * The rank literal to use in ORDER BY clause for relevance sorting
   * Returns undefined if searchTerm is empty or invalid
   */
  rankLiteral: ReturnType<typeof literal> | undefined;
}

/**
 * Builds full-text search conditions for PostgreSQL using tsvector and plainto_tsquery.
 *
 * This utility safely handles user input by:
 * - Trimming whitespace
 * - Escaping single quotes for SQL injection prevention
 * - Using plainto_tsquery which further sanitizes input
 * - Using unaccent_immutable() to match Vietnamese accented characters
 *
 * @param searchTerm - The search term to build conditions for
 * @param config - Optional configuration for search vector column and dictionary
 * @returns Object containing searchCondition and rankLiteral, or undefined values if searchTerm is invalid
 *
 * @example
 * ```typescript
 * const { searchCondition, rankLiteral } = buildFullTextSearch('john doe');
 * if (searchCondition) {
 *   whereClause[Op.and] = [searchCondition];
 * }
 * if (rankLiteral) {
 *   orderClause = [[rankLiteral, 'DESC'], ['createdAt', 'DESC']];
 * }
 * ```
 */
export function buildFullTextSearch(
  searchTerm: string | undefined | null,
  config: FullTextSearchConfig = {}
): FullTextSearchResult {
  const { searchVectorColumn = 'search_vector', dictionary = 'simple' } =
    config;

  // Return undefined if search term is empty or invalid
  if (!searchTerm || searchTerm.trim() === '') {
    return {
      searchCondition: undefined,
      rankLiteral: undefined,
    };
  }

  // Trim the search term
  const trimmedSearchTerm = searchTerm.trim();

  // Escape single quotes for SQL (plainto_tsquery handles other special chars)
  // This is safe because plainto_tsquery further sanitizes the input
  const escapedTerm = trimmedSearchTerm.replace(/'/g, "''");

  // Construct the full-text search condition using literal SQL
  // unaccent_immutable() is applied to the search term to match the unaccented search_vector
  // plainto_tsquery is a PostgreSQL function that safely handles user input
  // Example: searching "tam" will match "tâm", "tấm", "tẩm", etc.
  const searchCondition = literal(
    `${searchVectorColumn} @@ plainto_tsquery('${dictionary}', unaccent_immutable('${escapedTerm}'))`
  );

  // Order by relevance (ts_rank) when searching
  // Higher rank = better match
  const rankLiteral = literal(
    `ts_rank(${searchVectorColumn}, plainto_tsquery('${dictionary}', unaccent_immutable('${escapedTerm}')))`
  );

  return {
    searchCondition,
    rankLiteral,
  };
}
