import { describe, expect, it } from 'vitest';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import { ValidationException } from '@app/common/utils/exceptions';
import { validateText } from '@app/common/utils/validate-text';

describe('validateText', () => {
  describe('happy path', () => {
    it('should return valid text string when value is valid', () => {
      const result = validateText('test', { field: 'text' });

      expect(result).toBe('test');
    });

    it('should return undefined when value is undefined and not required', () => {
      const result = validateText(undefined, {
        field: 'text',
        required: false,
      });

      expect(result).toBeUndefined();
    });

    it('should return undefined when value is undefined and required is not specified', () => {
      const result = validateText(undefined, { field: 'text' });

      expect(result).toBeUndefined();
    });

    it('should return undefined when value is empty string and not required', () => {
      const result = validateText('', { field: 'text', required: false });

      expect(result).toBeUndefined();
    });

    it('should return text when value meets minLength requirement', () => {
      const result = validateText('test', {
        field: 'text',
        minLength: 4,
      });

      expect(result).toBe('test');
    });

    it('should return text when value meets maxLength requirement', () => {
      const result = validateText('test', {
        field: 'text',
        maxLength: 10,
      });

      expect(result).toBe('test');
    });

    it('should return text when value is within minLength and maxLength range', () => {
      const result = validateText('test', {
        field: 'text',
        minLength: 2,
        maxLength: 10,
      });

      expect(result).toBe('test');
    });

    it('should return text when value equals minLength', () => {
      const result = validateText('te', {
        field: 'text',
        minLength: 2,
      });

      expect(result).toBe('te');
    });

    it('should return text when value equals maxLength', () => {
      const result = validateText('testtest', {
        field: 'text',
        maxLength: 8,
      });

      expect(result).toBe('testtest');
    });

    it('should use default field name when not specified', () => {
      const result = validateText('test');

      expect(result).toBe('test');
    });
  });

  describe('validation errors - required field', () => {
    it('should throw ValidationException when value is undefined and required is true', () => {
      expect(() => {
        validateText(undefined, { field: 'text', required: true });
      }).toThrow(ValidationException);

      try {
        validateText(undefined, { field: 'text', required: true });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_REQUIRED
        );
        expect((error as ValidationException).data).toEqual({ field: 'text' });
      }
    });

    it('should throw ValidationException when value is empty string and required is true', () => {
      expect(() => {
        validateText('', { field: 'text', required: true });
      }).toThrow(ValidationException);

      try {
        validateText('', { field: 'text', required: true });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_REQUIRED
        );
        expect((error as ValidationException).data).toEqual({ field: 'text' });
      }
    });
  });

  describe('validation errors - invalid type', () => {
    it('should throw ValidationException when value is not a string', () => {
      expect(() => {
        validateText(123 as unknown as string, { field: 'text' });
      }).toThrow(ValidationException);

      try {
        validateText(123 as unknown as string, { field: 'text' });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_INVALID
        );
        expect((error as ValidationException).data).toEqual({ field: 'text' });
      }
    });

    it('should throw ValidationException when value is null', () => {
      expect(() => {
        validateText(null as unknown as string, { field: 'text' });
      }).toThrow(ValidationException);

      try {
        validateText(null as unknown as string, { field: 'text' });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_INVALID
        );
        expect((error as ValidationException).data).toEqual({ field: 'text' });
      }
    });
  });

  describe('validation errors - length constraints', () => {
    it('should throw ValidationException when value is too short', () => {
      expect(() => {
        validateText('te', {
          field: 'text',
          minLength: 5,
        });
      }).toThrow(ValidationException);

      try {
        validateText('te', {
          field: 'text',
          minLength: 5,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_TOO_SHORT
        );
        expect((error as ValidationException).data).toEqual({
          field: 'text',
          minLength: 5,
        });
      }
    });

    it('should throw ValidationException when value is too long', () => {
      expect(() => {
        validateText('testtesttest', {
          field: 'text',
          maxLength: 5,
        });
      }).toThrow(ValidationException);

      try {
        validateText('testtesttest', {
          field: 'text',
          maxLength: 5,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_TOO_LONG
        );
        expect((error as ValidationException).data).toEqual({
          field: 'text',
          maxLength: 5,
        });
      }
    });

    it('should throw ValidationException when value is outside minLength and maxLength range', () => {
      expect(() => {
        validateText('t', {
          field: 'text',
          minLength: 3,
          maxLength: 10,
        });
      }).toThrow(ValidationException);

      try {
        validateText('t', {
          field: 'text',
          minLength: 3,
          maxLength: 10,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_TOO_SHORT
        );
        expect((error as ValidationException).data).toEqual({
          field: 'text',
          minLength: 3,
        });
      }
    });
  });

  describe('edge cases', () => {
    it('should handle shouldTrim option (not implemented in current version)', () => {
      const result = validateText('  test  ', {
        field: 'text',
        shouldTrim: true,
      });

      expect(result).toBe('  test  ');
    });

    it('should return whitespace-only string when not required (shouldTrim not implemented)', () => {
      const result = validateText('   ', {
        field: 'text',
        required: false,
      });

      expect(result).toBe('   ');
    });

    it('should use custom field name in error messages', () => {
      try {
        validateText('', { field: 'username', required: true });
      } catch (error) {
        expect((error as ValidationException).data).toEqual({
          field: 'username',
        });
      }
    });
  });
});
