import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import { type ErrorValidationResult } from '@app/common/interfaces/error';
import { validate } from '@app/common/utils/validate';

/**
 * Username value object
 * Represents a validated username
 */
export class Username {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 20;
  private static readonly USERNAME_REGEXP = /^[a-zA-Z0-9_]+$/;

  private constructor(private readonly value: string) {}

  /**
   * Creates a Username value object, throwing ValidationException if invalid
   * @param username - Username string to validate and wrap
   * @returns Username value object
   * @throws ValidationException if username is invalid
   */
  static create(username: string): Username {
    const result = Username.tryCreate(username);
    validate(result);
    return result.username!;
  }

  /**
   * Attempts to create a Username value object, returning an ErrorValidationResult if invalid
   * @param username - Username string to validate and wrap
   * @returns Object with username and error, where error is undefined if valid
   */
  static tryCreate(username: string): {
    username?: Username;
    error?: ErrorValidationResult;
  } {
    if (username.length < Username.MIN_LENGTH) {
      return {
        error: {
          code: ValidationErrorCode.FIELD_IS_TOO_SHORT,
          data: {
            field: 'username',
            minLength: Username.MIN_LENGTH,
          },
        },
      };
    }

    if (username.length > Username.MAX_LENGTH) {
      return {
        error: {
          code: ValidationErrorCode.FIELD_IS_TOO_LONG,
          data: {
            field: 'username',
            maxLength: Username.MAX_LENGTH,
          },
        },
      };
    }

    if (!Username.USERNAME_REGEXP.test(username)) {
      return {
        error: {
          code: ValidationErrorCode.FIELD_IS_INVALID,
          data: {
            field: 'username',
            regex: Username.USERNAME_REGEXP.toString(),
            allowedCharacters: 'letters, numbers, and underscores',
          },
        },
      };
    }

    return {
      username: new Username(username),
    };
  }

  /**
   * Gets the username value as a string
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Compares two Username objects for equality
   */
  equals(other: Username): boolean {
    return this.value === other.value;
  }
}
