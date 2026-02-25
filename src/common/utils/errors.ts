/**
 * Business exception for domain-level errors
 * Represents business logic violations that should be handled gracefully
 */
export class BusinessError extends Error {
  constructor(
    public readonly code: string,
    public readonly data?: Record<string, unknown>,
    message?: string
  ) {
    super(message ?? code);
    this.name = 'BusinessError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BusinessError);
    }
  }
}

/**
 * Validation exception for input validation errors.
 */
export class ValidationError extends Error {
  constructor(
    public readonly code: string,
    public readonly data?: Record<string, unknown>,
    message?: string
  ) {
    super(message ?? code);
    this.name = 'ValidationError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

// Backward-compatible aliases during migration.
export {
  BusinessError as BusinessException,
  ValidationError as ValidationException,
};
