import { describe, expect, it } from 'vitest';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import { ValidationException } from '@app/common/utils/exceptions';
import { validate } from '@app/common/utils/validate';

describe('validate', () => {
  describe('happy path', () => {
    it('should not throw when boolean expression is true', () => {
      expect(() => {
        validate(true);
      }).not.toThrow();
    });

    it('should not throw when boolean expression is true with error', () => {
      expect(() => {
        validate(true, 'ERROR_CODE');
      }).not.toThrow();
    });

    it('should not throw when object expression has no error property', () => {
      expect(() => {
        validate({ uuid: 'test' });
      }).not.toThrow();
    });

    it('should not throw when object expression has undefined error property', () => {
      expect(() => {
        validate({ uuid: 'test', error: undefined });
      }).not.toThrow();
    });
  });

  describe('validation errors - boolean expression', () => {
    it('should throw ValidationException when boolean expression is false with string error code', () => {
      expect(() => {
        validate(false, 'ERROR_CODE');
      }).toThrow(ValidationException);

      try {
        validate(false, 'ERROR_CODE');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe('ERROR_CODE');
        expect((error as ValidationException).data).toBeUndefined();
      }
    });

    it('should throw ValidationException when boolean expression is false with ErrorValidationResult', () => {
      const errorResult = {
        code: ValidationErrorCode.FIELD_IS_REQUIRED,
        data: { field: 'email' },
      };

      expect(() => {
        validate(false, errorResult);
      }).toThrow(ValidationException);

      try {
        validate(false, errorResult);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_REQUIRED
        );
        expect((error as ValidationException).data).toEqual({ field: 'email' });
      }
    });

    it('should not throw when boolean expression is false without error parameter', () => {
      expect(() => {
        validate(false);
      }).not.toThrow();
    });
  });

  describe('validation errors - object expression with error property', () => {
    it('should throw ValidationException when object has error property with code only', () => {
      const result = {
        error: {
          code: ValidationErrorCode.FIELD_IS_INVALID,
        },
      };

      expect(() => {
        validate(result);
      }).toThrow(ValidationException);

      try {
        validate(result);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_INVALID
        );
        expect((error as ValidationException).data).toBeUndefined();
      }
    });

    it('should throw ValidationException when object has error property with code and data', () => {
      const result = {
        error: {
          code: ValidationErrorCode.FIELD_IS_REQUIRED,
          data: { field: 'username' },
        },
      };

      expect(() => {
        validate(result);
      }).toThrow(ValidationException);

      try {
        validate(result);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_REQUIRED
        );
        expect((error as ValidationException).data).toEqual({
          field: 'username',
        });
      }
    });

    it('should handle tryCreate result pattern correctly', () => {
      const tryCreateResult = {
        uuid: undefined,
        error: {
          code: ValidationErrorCode.FIELD_IS_INVALID,
          data: { field: 'id' },
        },
      };

      expect(() => {
        validate(tryCreateResult);
      }).toThrow(ValidationException);

      try {
        validate(tryCreateResult);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_INVALID
        );
        expect((error as ValidationException).data).toEqual({ field: 'id' });
      }
    });
  });

  describe('edge cases', () => {
    it('should handle object with multiple properties and error', () => {
      const result = {
        email: 'test@example.com',
        username: 'testuser',
        error: {
          code: ValidationErrorCode.FIELD_IS_TOO_LONG,
          data: { field: 'username', maxLength: 10 },
        },
      };

      expect(() => {
        validate(result);
      }).toThrow(ValidationException);

      try {
        validate(result);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_TOO_LONG
        );
        expect((error as ValidationException).data).toEqual({
          field: 'username',
          maxLength: 10,
        });
      }
    });

    it('should handle empty object', () => {
      expect(() => {
        validate({});
      }).not.toThrow();
    });
  });
});
