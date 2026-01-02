/**
 * Validation result for error cases
 */
export interface ErrorValidationResult {
  code: string;
  data?: Record<string, unknown>;
  message?: string;
}
