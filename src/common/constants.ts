/**
 * Application constants used across the application
 */

/**
 * Pagination constants
 */
export const PAGINATION_DEFAULT_ITEMS_PER_PAGE =
  Number(process.env['PAGINATION_DEFAULT_ITEMS_PER_PAGE']) || 50;

export const PAGINATION_MAX_ITEMS_PER_PAGE =
  Number(process.env['PAGINATION_MAX_ITEMS_PER_PAGE']) || 100;

/**
 * Search constants
 */
export const SEARCH_TERM_MAX_LENGTH =
  Number(process.env['SEARCH_TERM_MAX_LENGTH']) || 50;

/**
 * Text length constants
 * These constants align with database schema constraints
 */
export const TEXT_MAX_LENGTH = 255;
export const TEXT_DESCRIPTION_MAX_LENGTH = 1000;
