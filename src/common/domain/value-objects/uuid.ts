import { validate as isValidUuid, v4 as uuidv4 } from 'uuid';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import { type ErrorValidationResult } from '@app/common/interfaces/error';
import { validate } from '@app/common/utils/validate';

/**
 * UUID value object
 * Represents a validated UUID (Universally Unique Identifier)
 * Can be used for any entity ID that requires UUID validation
 */
export class Uuid {
  private constructor(private readonly value: string) {}

  /**
   * Creates a Uuid value object, throwing ValidationException if invalid
   * @param value - UUID string to validate and wrap
   * @param fieldName - Optional field name for error messages (defaults to 'id')
   * @returns Uuid value object
   * @throws ValidationException if UUID is invalid
   */
  static create(
    value: string | undefined | null,
    fieldName: string = 'id'
  ): Uuid {
    const result = Uuid.tryCreate(value, fieldName);
    validate(result);
    return result.uuid!;
  }

  /**
   * Attempts to create a Uuid value object, returning an ErrorValidationResult if invalid
   * @param value - UUID string to validate and wrap
   * @param fieldName - Optional field name for error messages (defaults to 'id')
   * @returns Object with uuid and error, where error is undefined if valid
   */
  static tryCreate(
    value: string | undefined | null,
    fieldName: string = 'id'
  ): {
    uuid?: Uuid;
    error?: ErrorValidationResult;
  } {
    // eslint-disable-next-line no-null/no-null
    if (value === undefined || value === null) {
      return {
        error: {
          code: ValidationErrorCode.FIELD_IS_REQUIRED,
          data: {
            field: fieldName,
          },
        },
      };
    }

    if (typeof value !== 'string') {
      return {
        error: {
          code: ValidationErrorCode.FIELD_IS_INVALID,
          data: {
            field: fieldName,
          },
        },
      };
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return {
        error: {
          code: ValidationErrorCode.FIELD_IS_REQUIRED,
          data: {
            field: fieldName,
          },
        },
      };
    }

    if (!isValidUuid(trimmed)) {
      return {
        error: {
          code: ValidationErrorCode.FIELD_IS_INVALID,
          data: {
            field: fieldName,
          },
        },
      };
    }

    return {
      uuid: new Uuid(trimmed),
    };
  }

  /**
   * Gets the UUID value as a string
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Compares two Uuid objects for equality
   */
  equals(other: Uuid): boolean {
    return this.value === other.value;
  }

  /**
   * Generates a new random UUID (v4)
   * Used for creating new aggregate IDs
   * @returns A new Uuid instance with a randomly generated UUID
   */
  static generate(): Uuid {
    return new Uuid(uuidv4());
  }
}
