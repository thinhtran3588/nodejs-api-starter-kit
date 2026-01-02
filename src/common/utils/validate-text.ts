import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import { ValidationException } from '@app/common/utils/exceptions';

export interface ValidateTextOptions {
  field: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  shouldTrim?: boolean;
}

export const validateText = (
  value: string | undefined,
  options: ValidateTextOptions = { field: 'text' }
): string | undefined => {
  const { field, minLength, maxLength, required = false } = options;

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

  if (required && value.length === 0) {
    throw new ValidationException(ValidationErrorCode.FIELD_IS_REQUIRED, {
      field,
    });
  }

  if (value.length === 0) {
    return undefined;
  }

  if (minLength !== undefined && value.length < minLength) {
    throw new ValidationException(ValidationErrorCode.FIELD_IS_TOO_SHORT, {
      field,
      minLength,
    });
  }

  if (maxLength !== undefined && value.length > maxLength) {
    throw new ValidationException(ValidationErrorCode.FIELD_IS_TOO_LONG, {
      field,
      maxLength,
    });
  }

  return value;
};
