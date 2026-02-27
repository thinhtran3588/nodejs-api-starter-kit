import { sql, type SQL } from 'drizzle-orm';

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
  searchCondition: SQL | undefined;
  /**
   * The rank literal to use in ORDER BY clause for relevance sorting
   * Returns undefined if searchTerm is empty or invalid
   */
  rankLiteral: SQL | undefined;
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
 *   whereConditions.push(searchCondition);
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

  const safeVectorColumn = /^[a-zA-Z0-9_.]+$/.test(searchVectorColumn)
    ? searchVectorColumn
    : 'search_vector';
  const safeDictionary = /^[a-zA-Z0-9_]+$/.test(dictionary)
    ? dictionary
    : 'simple';
  const dictionaryLiteral = `'${safeDictionary}'`;

  // Construct the full-text search condition using SQL templates
  // unaccent_immutable() is applied to the search term to match the unaccented search_vector
  // plainto_tsquery is a PostgreSQL function that safely handles user input
  // Example: searching "tam" will match "tâm", "tấm", "tẩm", etc.
  const searchCondition = sql`
    ${sql.raw(safeVectorColumn)} @@ plainto_tsquery(${sql.raw(
      dictionaryLiteral
    )}, unaccent_immutable(${trimmedSearchTerm}))
  `;

  // Order by relevance (ts_rank) when searching
  // Higher rank = better match
  const rankLiteral = sql`
    ts_rank(${sql.raw(safeVectorColumn)}, plainto_tsquery(${sql.raw(
      dictionaryLiteral
    )}, unaccent_immutable(${trimmedSearchTerm})))
  `;

  return {
    searchCondition,
    rankLiteral,
  };
}
