/**
 * Business exception for domain-level errors
 * Represents business logic violations that should be handled gracefully
 */
export class BusinessException extends Error {
  constructor(
    public readonly code: string,
    public readonly data?: Record<string, unknown>,
    message?: string
  ) {
    super(message ?? code);
    this.name = 'BusinessException';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BusinessException);
    }
  }
}

/**
 * Validation exception for input validation errors
 * Extends BusinessException to provide type-level distinction for validation errors
 * while maintaining backward compatibility with BusinessException handling
 */
export class ValidationException extends BusinessException {
  constructor(code: string, data?: Record<string, unknown>, message?: string) {
    super(code, data, message);
    this.name = 'ValidationException';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationException);
    }
  }
}
