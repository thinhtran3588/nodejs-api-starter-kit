import { type ErrorValidationResult } from '@app/common/interfaces/error';
import { ValidationException } from '@app/common/utils/exceptions';

export const validate = (
  expression:
    | boolean
    | {
        error?: ErrorValidationResult;
        [key: string]: unknown;
      },
  error?: string | ErrorValidationResult
): void => {
  // Handle boolean expression
  if (typeof expression === 'boolean') {
    if (!expression && error) {
      if (typeof error === 'string') {
        throw new ValidationException(error);
      } else {
        const { code, data, message } = error;
        throw new ValidationException(code, data, message);
      }
    }
    return;
  }

  // Handle object expression with error property (can be result object from tryCreate)
  if (expression.error) {
    const { code, data, message } = expression.error;
    throw new ValidationException(code, data, message);
  }
};
