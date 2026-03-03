import { sql, type SQL } from 'drizzle-orm';

const MAX_FULL_TEXT_TERMS = 8;

function sanitizeSearchToken(term: string): string {
  return term
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_]/gu, '');
}

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
 * Builds full-text search conditions for PostgreSQL using tsvector and to_tsquery.
 *
 * This utility safely handles user input by:
 * - Trimming whitespace
 * - Sanitizing terms to alphanumeric tokens
 * - Limiting the number of terms for predictable query performance
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

  // Split into individual terms, sanitize tokens for tsquery safety,
  // deduplicate and cap the term count to keep query cost bounded.
  const terms = Array.from(
    new Set(
      trimmedSearchTerm
        .split(/\s+/)
        .map(sanitizeSearchToken)
        .filter((term) => term.length > 0)
    )
  ).slice(0, MAX_FULL_TEXT_TERMS);

  // Build a prefix search query (e.g., "use" -> "use:*", "user test" -> "user:* & test:*")
  const tsQuery = terms.map((term) => `${term}:*`).join(' & ');

  // If nothing valid remains after sanitization, skip search
  if (terms.length === 0) {
    return {
      searchCondition: undefined,
      rankLiteral: undefined,
    };
  }

  const safeVectorColumn = /^[a-zA-Z0-9_.]+$/.test(searchVectorColumn)
    ? searchVectorColumn
    : 'search_vector';
  const safeDictionary = /^[a-zA-Z0-9_]+$/.test(dictionary)
    ? dictionary
    : 'simple';
  const dictionaryLiteral = `'${safeDictionary}'`;

  const tsQueryLiteral = sql`
    to_tsquery(
      ${sql.raw(dictionaryLiteral)},
      unaccent_immutable(${tsQuery})
    )
  `;

  // Construct the full-text search condition using SQL templates
  // unaccent_immutable() is applied to the search term to match the unaccented search_vector
  // to_tsquery is used with prefix operators (:*), so searching "use" will match "user"
  // Example: searching "tam" will match "tâm", "tấm", "tẩm", etc.
  const fullTextSearchCondition = sql`
    ${sql.raw(safeVectorColumn)} @@ ${tsQueryLiteral}
  `;

  // Order by relevance (ts_rank) when searching
  // Higher rank = better match
  const rankLiteral = sql`
    ts_rank(
      ${sql.raw(safeVectorColumn)},
      ${tsQueryLiteral}
    )
  `;

  return {
    searchCondition: fullTextSearchCondition,
    rankLiteral,
  };
}
