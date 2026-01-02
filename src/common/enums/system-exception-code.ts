/**
 * Common system-level exception codes that can be reused across all modules
 * These represent infrastructure and system errors that are not domain-specific
 */
export enum SystemExceptionCode {
  /**
   * Internal server error - unexpected system error
   */
  INTERNAL_ERROR = 'INTERNAL_ERROR',

  /**
   * Data corruption error - invalid data found in database or storage
   */
  DATA_CORRUPTION_ERROR = 'DATA_CORRUPTION_ERROR',
}
