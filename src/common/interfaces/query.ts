import type { AppContext } from '@app/common/interfaces/context';

/**
 * Base pagination query parameters interface (domain layer)
 * Used by repository interfaces - does not include context
 */
export interface PaginationQueryParams {
  /**
   * Optional zero-based page index (0 = first page)
   */
  readonly pageIndex?: number;

  /**
   * Optional number of items per page (default is 50)
   * Maximum is 100
   */
  readonly itemsPerPage?: number;

  /**
   * Optional array of field names to include in the response.
   * If not provided, all fields are returned.
   */
  readonly fields?: string[];

  /**
   * Optional field name to sort by.
   * Must be one of the valid sort fields for the entity.
   */
  readonly sortField?: string;

  /**
   * Optional sort order: 'ASC' or 'DESC'.
   * Defaults to 'ASC' if sortField is provided.
   */
  readonly sortOrder?: 'ASC' | 'DESC';
}

/**
 * Cursor-based pagination query parameters interface (domain layer)
 * Used by repository interfaces - does not include context
 */
export interface CursorPaginationQueryParams {
  /**
   * Cursor value to start pagination from (typically an ID or timestamp)
   * If not provided, pagination starts from the beginning
   */
  readonly cursor?: string;

  /**
   * Number of items per page
   */
  readonly limit: number;

  /**
   * Optional array of field names to include in the response.
   * If not provided, all fields are returned.
   */
  readonly fields?: string[];
}

/**
 * General paginated result interface with data and pagination info
 * Matches GraphQL PaginationInfo structure
 */
export interface PaginatedResult<T> {
  /**
   * Array of items
   */
  data: T[];

  /**
   * Pagination information
   */
  pagination: {
    /**
     * Total count of items (before pagination)
     */
    count: number;

    /**
     * Zero-based page index (0 = first page)
     */
    pageIndex: number;
  };
}

/**
 * Cursor-based paginated result interface with data and next cursor
 */
export interface CursorPaginatedResult<T> {
  /**
   * Array of items
   */
  data: T[];

  /**
   * Cursor for the next page (if there are more items)
   * If not provided, there are no more items to fetch
   */
  nextCursor?: string;
}

/**
 * Base interface for all queries (read operations)
 * Queries should not have side effects
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Query {}

/**
 * Pagination query interface extending Query (application layer)
 * Adds context to domain-level PaginationQueryParams
 */
export interface PaginationQuery extends Query, PaginationQueryParams {}

/**
 * Cursor-based pagination query interface extending Query (application layer)
 * Adds context to domain-level CursorPaginationQueryParams
 */
export interface CursorPaginationQuery
  extends Query,
    CursorPaginationQueryParams {}

/**
 * Query handler interface
 * Handles execution of a specific query type
 * @template TQuery - The query type
 * @template TResult - The return type of the query handler
 */
export interface QueryHandler<TQuery extends Query, TResult> {
  execute(query: TQuery, context?: AppContext): Promise<TResult>;
}
