import { describe, expect, it } from 'vitest';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import { ValidationException } from '@app/common/utils/exceptions';
import { validateSearchTerm } from '@app/common/utils/validate-search-term';

describe('validateSearchTerm', () => {
  describe('happy path', () => {
    it('should return undefined when searchTerm is undefined', () => {
      const result = validateSearchTerm(undefined);

      expect(result).toBeUndefined();
    });

    it('should return validated search term when searchTerm is valid', () => {
      const validSearchTerm = 'test search';
      const result = validateSearchTerm(validSearchTerm);

      expect(result).toBe(validSearchTerm);
    });

    it('should return validated search term within max length', () => {
      const searchTerm = 'a'.repeat(50);
      const result = validateSearchTerm(searchTerm);

      expect(result).toBe(searchTerm);
    });
  });

  describe('validation errors', () => {
    it('should throw ValidationException when searchTerm exceeds max length', () => {
      expect(() => {
        validateSearchTerm('a'.repeat(51));
      }).toThrow(ValidationException);

      try {
        validateSearchTerm('a'.repeat(51));
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        expect((error as ValidationException).code).toBe(
          ValidationErrorCode.FIELD_IS_TOO_LONG
        );
        expect((error as ValidationException).data).toEqual({
          field: 'searchTerm',
          maxLength: 50,
        });
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = validateSearchTerm('');

      expect(result).toBeUndefined();
    });

    it('should handle whitespace-only string', () => {
      const result = validateSearchTerm('   ');

      expect(result).toBe('   ');
    });

    it('should handle search term at max length boundary', () => {
      const searchTerm = 'a'.repeat(50);
      const result = validateSearchTerm(searchTerm);

      expect(result).toBe(searchTerm);
    });
  });
});
