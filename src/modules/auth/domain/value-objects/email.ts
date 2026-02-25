import {
  validate,
  ValidationErrorCode,
  ValidationException,
} from '@app/common';

/**
 * Email value object
 * Represents a validated email address
 */
export class Email {
  private static readonly EMAIL_REGEXP = /^[\w.+-]+@([\w-]+\.)+[\w-]{2,4}$/;

  private constructor(private readonly value: string) {}

  /**
   * Creates an Email value object, throwing ValidationException if invalid
   * @param email - Email string to validate and wrap
   * @returns Email value object
   * @throws ValidationException if email is invalid
   */
  static create(email: string): Email {
    const result = Email.tryCreate(email);
    validate(result);
    return result.email!;
  }

  /**
   * Attempts to create an Email value object, returning a ValidationException if invalid
   * @param email - Email string to validate and wrap
   * @returns Object with email and error, where error is undefined if valid
   */
  static tryCreate(email: string): {
    email?: Email;
    error?: ValidationException;
  } {
    const trimmed = email.trim();
    if (!trimmed || trimmed.length === 0) {
      return {
        error: new ValidationException(ValidationErrorCode.FIELD_IS_REQUIRED, {
          field: 'email',
        }),
      };
    }

    const lowercased = trimmed.toLowerCase();

    if (!Email.EMAIL_REGEXP.test(lowercased)) {
      return {
        error: new ValidationException(ValidationErrorCode.FIELD_IS_INVALID, {
          field: 'email',
        }),
      };
    }

    return {
      email: new Email(lowercased),
    };
  }

  /**
   * Gets the email value as a string
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Compares two Email objects for equality (case-insensitive)
   */
  equals(other: Email): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }
}
