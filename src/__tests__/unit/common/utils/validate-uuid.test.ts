import { describe, expect, it } from 'vitest';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import { ValidationException } from '@app/common/utils/exceptions';
import { validateUuid } from '@app/common/utils/validate-uuid';

describe('validateUuid', () => {
  describe('happy path', () => {
    it('should return valid UUID string when value is valid', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = validateUuid(validUuid, { field: 'id' });

      expect(result).toBe(validUuid);
    });

    it('should return trimmed UUID when value has whitespace', () => {
      const uuidWithWhitespace = '  550e8400-e29b-41d4-a716-446655440000  ';
      const result = validateUuid(uuidWithWhitespace, { field: 'id' });

      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should return undefined when value is undefined and not required', () => {
      const result = validateUuid(undefined, { field: 'id', required: false });

      expect(result).toBeUndefined();
    });

    it('should return undefined when value is undefined and required is not specified', () => {
      const result = validateUuid(undefined, { field: 'id' });

      expect(result).toBeUndefined();
    });

    it('should return undefined when value is empty string and not required', () => {
      const result = validateUuid('   ', { field: 'id', required: false });

      expect(result).toBeUndefined();
    });
  });

  describe('validation errors - required field', () => {
    it('should throw ValidationException when value is undefined and required is true', () => {
      expect(() => {
        validateUuid(undefined, { field: 'id', required: true });
      }).toThrow(ValidationException);

      try {
        validateUuid(undefined, { field: 'id', required: true });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_REQUIRED
        );
        expect((error as ValidationException).data).toEqual({ field: 'id' });
      }
    });

    it('should throw ValidationException when value is empty string and required is true', () => {
      expect(() => {
        validateUuid('   ', { field: 'id', required: true });
      }).toThrow(ValidationException);

      try {
        validateUuid('   ', { field: 'id', required: true });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_REQUIRED
        );
        expect((error as ValidationException).data).toEqual({ field: 'id' });
      }
    });
  });

  describe('validation errors - invalid type', () => {
    it('should throw ValidationException when value is not a string', () => {
      expect(() => {
        validateUuid(123 as unknown as string, { field: 'id' });
      }).toThrow(ValidationException);

      try {
        validateUuid(123 as unknown as string, { field: 'id' });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_INVALID
        );
        expect((error as ValidationException).data).toEqual({ field: 'id' });
      }
    });

    it('should throw ValidationException when value is null', () => {
      expect(() => {
        validateUuid(null as unknown as string, { field: 'id' });
      }).toThrow(ValidationException);

      try {
        validateUuid(null as unknown as string, { field: 'id' });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_INVALID
        );
        expect((error as ValidationException).data).toEqual({ field: 'id' });
      }
    });
  });

  describe('validation errors - invalid UUID format', () => {
    it('should throw ValidationException when value is not a valid UUID', () => {
      expect(() => {
        validateUuid('not-a-uuid', { field: 'id' });
      }).toThrow(ValidationException);

      try {
        validateUuid('not-a-uuid', { field: 'id' });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_INVALID
        );
        expect((error as ValidationException).data).toEqual({ field: 'id' });
      }
    });

    it('should throw ValidationException when value is malformed UUID', () => {
      expect(() => {
        validateUuid('550e8400-e29b-41d4-a716', { field: 'id' });
      }).toThrow(ValidationException);

      try {
        validateUuid('550e8400-e29b-41d4-a716', { field: 'id' });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_INVALID
        );
        expect((error as ValidationException).data).toEqual({ field: 'id' });
      }
    });

    it('should throw ValidationException when value is empty string with invalid UUID', () => {
      expect(() => {
        validateUuid('invalid', { field: 'id' });
      }).toThrow(ValidationException);
    });
  });

  describe('edge cases', () => {
    it('should handle different UUID versions correctly', () => {
      const uuidV1 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
      const uuidV4 = '550e8400-e29b-41d4-a716-446655440000';
      const uuidV5 = '886313e1-3b8a-5372-9b90-0c9aee199e5d';

      expect(validateUuid(uuidV1, { field: 'id' })).toBe(uuidV1);
      expect(validateUuid(uuidV4, { field: 'id' })).toBe(uuidV4);
      expect(validateUuid(uuidV5, { field: 'id' })).toBe(uuidV5);
    });

    it('should use custom field name in error messages', () => {
      try {
        validateUuid('invalid', { field: 'userId' });
      } catch (error) {
        expect((error as ValidationException).data).toEqual({
          field: 'userId',
        });
      }
    });
  });
});
