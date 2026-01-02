import { validate as isValidUuid } from 'uuid';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import { ValidationException } from '@app/common/utils/exceptions';

export interface ValidateUuidOptions {
  field: string;
  required?: boolean;
}

/**
 * Validates that a value is a valid UUID
 * @param value - The value to validate
 * @param options - Validation options including field name and required flag
 * @returns The validated UUID string, or undefined if not required and value is undefined
 * @throws ValidationException if the value is invalid
 */
export const validateUuid = (
  value: string | undefined,
  options: ValidateUuidOptions
): string | undefined => {
  const { field, required = false } = options;

  if (value === undefined) {
    if (required) {
      throw new ValidationException(ValidationErrorCode.FIELD_IS_REQUIRED, {
        field,
      });
    }
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new ValidationException(ValidationErrorCode.FIELD_IS_INVALID, {
      field,
    });
  }

  const trimmed = value.trim();

  if (required && trimmed.length === 0) {
    throw new ValidationException(ValidationErrorCode.FIELD_IS_REQUIRED, {
      field,
    });
  }

  if (trimmed.length === 0) {
    return undefined;
  }

  if (!isValidUuid(trimmed)) {
    throw new ValidationException(ValidationErrorCode.FIELD_IS_INVALID, {
      field,
    });
  }

  return trimmed;
};
