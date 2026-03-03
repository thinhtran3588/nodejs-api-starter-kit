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

  // Trim the search term and normalize whitespace
  const trimmedSearchTerm = searchTerm.trim();

  // Split into individual terms, remove characters that have special meaning in tsquery,
  // and build a prefix search query (e.g., "use" -> "use:*", "user test" -> "user:* & test:*")
  const terms = trimmedSearchTerm
    .split(/\s+/)
    .map((term) => term.replace(/[&|:!]/g, ''))
    .filter((term) => term.length > 0);

  // If nothing valid remains after sanitization, skip search
  if (terms.length === 0) {
    return {
      searchCondition: undefined,
      rankLiteral: undefined,
    };
  }

  const tsQuery = terms.map((term) => `${term}:*`).join(' & ');

  const safeVectorColumn = /^[a-zA-Z0-9_.]+$/.test(searchVectorColumn)
    ? searchVectorColumn
    : 'search_vector';
  const safeDictionary = /^[a-zA-Z0-9_]+$/.test(dictionary)
    ? dictionary
    : 'simple';
  const dictionaryLiteral = `'${safeDictionary}'`;

  // Construct the full-text search condition using SQL templates
  // unaccent_immutable() is applied to the search term to match the unaccented search_vector
  // to_tsquery is used with prefix operators (:*), so searching "use" will match "user"
  // Example: searching "tam" will match "tâm", "tấm", "tẩm", etc.
  const fullTextSearchCondition = sql`
    ${sql.raw(safeVectorColumn)} @@ to_tsquery(
      ${sql.raw(dictionaryLiteral)},
      unaccent_immutable(${tsQuery})
    )
  `;

  // For single-term queries, include a substring fallback so terms like "xyz"
  // can match concatenated tokens such as "abcxyz".
  const searchCondition =
    terms.length === 1
      ? sql`(
          ${fullTextSearchCondition}
          OR ${sql.raw(safeVectorColumn)}::text ILIKE ${`%${terms[0]}%`}
        )`
      : fullTextSearchCondition;

  // Order by relevance (ts_rank) when searching
  // Higher rank = better match
  const rankLiteral = sql`
    ts_rank(
      ${sql.raw(safeVectorColumn)},
      to_tsquery(
        ${sql.raw(dictionaryLiteral)},
        unaccent_immutable(${tsQuery})
      )
    )
  `;

  return {
    searchCondition,
    rankLiteral,
  };
}
