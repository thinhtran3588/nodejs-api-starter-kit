import { ValidationException } from './errors';

export const validate = (
  expression:
    | boolean
    | {
        error?: ValidationException;
        [key: string]: unknown;
      },
  error?: string | ValidationException
): void => {
  // Handle boolean expression
  if (typeof expression === 'boolean') {
    if (!expression && error) {
      if (typeof error === 'string') {
        throw new ValidationException(error);
      } else {
        throw error;
      }
    }
    return;
  }

  // Handle object expression with error property (can be result object from tryCreate)
  if (expression.error) {
    throw expression.error;
  }
};
