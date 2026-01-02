import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import { type ErrorValidationResult } from '@app/common/interfaces/error';
import { validate } from '@app/common/utils/validate';

/**
 * Password value object
 * Represents a validated password
 * Password must be 8-20 characters and contain:
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one digit (0-9)
 * - At least one special character (!@#$%^&*(),.?":{}|<>)
 */
export class Password {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 20;
  /**
   * Combined regex pattern that validates:
   * - At least one uppercase letter [A-Z]
   * - At least one lowercase letter [a-z]
   * - At least one digit [0-9]
   * - At least one special character [!@#$%^&*(),.?":{}|<>]
   * - Length between 8 and 20 characters
   */
  private static readonly PASSWORD_REGEXP =
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,20}$/;

  private constructor(private readonly value: string) {}

  /**
   * Creates a Password value object, throwing ValidationException if invalid
   * @param password - Password string to validate and wrap
   * @returns Password value object
   * @throws ValidationException if password is invalid
   */
  static create(password: string): Password {
    const result = Password.tryCreate(password);
    validate(result);
    return result.password!;
  }

  /**
   * Attempts to create a Password value object, returning an ErrorValidationResult if invalid
   * @param password - Password string to validate and wrap
   * @returns Object with password and error, where error is undefined if valid
   */
  static tryCreate(password: string): {
    password?: Password;
    error?: ErrorValidationResult;
  } {
    if (!password || password.length === 0) {
      return {
        error: {
          code: ValidationErrorCode.FIELD_IS_REQUIRED,
          data: {
            field: 'password',
          },
        },
      };
    }

    if (password.length < Password.MIN_LENGTH) {
      return {
        error: {
          code: ValidationErrorCode.FIELD_IS_TOO_SHORT,
          data: {
            field: 'password',
            minLength: Password.MIN_LENGTH,
          },
        },
      };
    }

    if (password.length > Password.MAX_LENGTH) {
      return {
        error: {
          code: ValidationErrorCode.FIELD_IS_TOO_LONG,
          data: {
            field: 'password',
            maxLength: Password.MAX_LENGTH,
          },
        },
      };
    }

    if (!Password.PASSWORD_REGEXP.test(password)) {
      return {
        error: {
          code: ValidationErrorCode.FIELD_IS_INVALID,
          data: {
            field: 'password',
            requirements: {
              requiresUppercase: true,
              requiresLowercase: true,
              requiresDigit: true,
              requiresSpecialChar: true,
              specialCharacters: '!@#$%^&*(),.?":{}|<>',
            },
            regex: Password.PASSWORD_REGEXP.toString(),
          },
        },
      };
    }

    return {
      password: new Password(password),
    };
  }

  /**
   * Gets the password value as a string
   * Note: This should only be used when passing to Firebase or other external services
   * Never log or store the raw password value
   */
  getValue(): string {
    return this.value;
  }
}
