import { describe, expect, it } from 'vitest';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import { ValidationException } from '@app/common/utils/exceptions';
import { Password } from '@app/modules/auth/domain/value-objects/password';

describe('Password', () => {
  const validPassword = 'ValidPass123!';
  const validPasswordMinLength = 'Abc123!@';
  const validPasswordMaxLength = 'Abcdefgh123456789!@';

  describe('create - happy path', () => {
    it('should create a Password from a valid password string', () => {
      const password = Password.create(validPassword);
      expect(password.getValue()).toBe(validPassword);
    });

    it('should create a Password with minimum length', () => {
      const password = Password.create(validPasswordMinLength);
      expect(password.getValue()).toBe(validPasswordMinLength);
    });

    it('should create a Password with maximum length', () => {
      const password = Password.create(validPasswordMaxLength);
      expect(password.getValue()).toBe(validPasswordMaxLength);
    });

    it('should create a Password with all required character types', () => {
      const password = Password.create('Test123!@#');
      expect(password.getValue()).toBe('Test123!@#');
    });

    it('should create a Password with special characters', () => {
      const password = Password.create('Test123()');
      expect(password.getValue()).toBe('Test123()');
    });

    it('should create a Password with comma and period', () => {
      const password = Password.create('Test123,.');
      expect(password.getValue()).toBe('Test123,.');
    });
  });

  describe('create - validation errors', () => {
    it('should throw ValidationException for undefined value', () => {
      expect(() => Password.create(undefined as unknown as string)).toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException for null value', () => {
      expect(() => Password.create(null as unknown as string)).toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException for empty string', () => {
      expect(() => Password.create('')).toThrow(ValidationException);
    });

    it('should throw ValidationException for password shorter than minimum length', () => {
      expect(() => Password.create('Abc123!')).toThrow(ValidationException);
    });

    it('should throw ValidationException for password longer than maximum length', () => {
      expect(() => Password.create('Abcdefgh123456789!@XY')).toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException for password without uppercase letter', () => {
      expect(() => Password.create('lowercase123!')).toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException for password without lowercase letter', () => {
      expect(() => Password.create('UPPERCASE123!')).toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException for password without digit', () => {
      expect(() => Password.create('NoDigits!@')).toThrow(ValidationException);
    });

    it('should throw ValidationException for password without special character', () => {
      expect(() => Password.create('NoSpecial123')).toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException for password with only letters', () => {
      expect(() => Password.create('OnlyLetters')).toThrow(ValidationException);
    });

    it('should throw ValidationException for password with only numbers', () => {
      expect(() => Password.create('12345678')).toThrow(ValidationException);
    });

    it('should throw ValidationException for password with only special characters', () => {
      expect(() => Password.create('!@#$%^&*')).toThrow(ValidationException);
    });
  });

  describe('tryCreate - happy path', () => {
    it('should return password for valid password string', () => {
      const result = Password.tryCreate(validPassword);
      expect(result.password).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.password!.getValue()).toBe(validPassword);
    });

    it('should return password with minimum length', () => {
      const result = Password.tryCreate(validPasswordMinLength);
      expect(result.password).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.password!.getValue()).toBe(validPasswordMinLength);
    });

    it('should return password with maximum length', () => {
      const result = Password.tryCreate(validPasswordMaxLength);
      expect(result.password).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.password!.getValue()).toBe(validPasswordMaxLength);
    });

    it('should return password with all required character types', () => {
      const result = Password.tryCreate('Test123!@#');
      expect(result.password).toBeDefined();
      expect(result.error).toBeUndefined();
    });
  });

  describe('tryCreate - validation errors', () => {
    it('should return error for undefined value', () => {
      const result = Password.tryCreate(undefined as unknown as string);
      expect(result.password).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_REQUIRED);
      expect(result.error!.data?.['field']).toBe('password');
    });

    it('should return error for null value', () => {
      const result = Password.tryCreate(null as unknown as string);
      expect(result.password).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_REQUIRED);
      expect(result.error!.data?.['field']).toBe('password');
    });

    it('should return error for empty string', () => {
      const result = Password.tryCreate('');
      expect(result.password).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_REQUIRED);
      expect(result.error!.data?.['field']).toBe('password');
    });

    it('should return error for password shorter than minimum length', () => {
      const result = Password.tryCreate('Abc123!');
      expect(result.password).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_TOO_SHORT);
      expect(result.error!.data?.['field']).toBe('password');
      expect(result.error!.data?.['minLength']).toBe(8);
    });

    it('should return error for password longer than maximum length', () => {
      const result = Password.tryCreate('Abcdefgh123456789!@XY');
      expect(result.password).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_TOO_LONG);
      expect(result.error!.data?.['field']).toBe('password');
      expect(result.error!.data?.['maxLength']).toBe(20);
    });

    it('should return error for password without uppercase letter', () => {
      const result = Password.tryCreate('lowercase123!');
      expect(result.password).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_INVALID);
      expect(result.error!.data?.['field']).toBe('password');
      const requirements = result.error!.data?.['requirements'] as
        | Record<string, unknown>
        | undefined;
      expect(requirements).toBeDefined();
      expect(requirements?.['requiresUppercase']).toBe(true);
    });

    it('should return error for password without lowercase letter', () => {
      const result = Password.tryCreate('UPPERCASE123!');
      expect(result.password).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_INVALID);
      expect(result.error!.data?.['field']).toBe('password');
      const requirements = result.error!.data?.['requirements'] as
        | Record<string, unknown>
        | undefined;
      expect(requirements).toBeDefined();
      expect(requirements?.['requiresLowercase']).toBe(true);
    });

    it('should return error for password without digit', () => {
      const result = Password.tryCreate('NoDigits!@');
      expect(result.password).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_INVALID);
      expect(result.error!.data?.['field']).toBe('password');
      const requirements = result.error!.data?.['requirements'] as
        | Record<string, unknown>
        | undefined;
      expect(requirements).toBeDefined();
      expect(requirements?.['requiresDigit']).toBe(true);
    });

    it('should return error for password without special character', () => {
      const result = Password.tryCreate('NoSpecial123');
      expect(result.password).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_INVALID);
      expect(result.error!.data?.['field']).toBe('password');
      const requirements = result.error!.data?.['requirements'] as
        | Record<string, unknown>
        | undefined;
      expect(requirements).toBeDefined();
      expect(requirements?.['requiresSpecialChar']).toBe(true);
    });

    it('should return error for password with only letters', () => {
      const result = Password.tryCreate('OnlyLetters');
      expect(result.password).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_INVALID);
    });

    it('should return error for password with only numbers', () => {
      const result = Password.tryCreate('12345678');
      expect(result.password).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_INVALID);
    });

    it('should return error for password with only special characters', () => {
      const result = Password.tryCreate('!@#$%^&*');
      expect(result.password).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_INVALID);
    });
  });

  describe('getValue', () => {
    it('should return the password string value', () => {
      const password = Password.create(validPassword);
      expect(password.getValue()).toBe(validPassword);
    });

    it('should return the exact password value without modification', () => {
      const passwordValue = 'Test123!@#';
      const password = Password.create(passwordValue);
      expect(password.getValue()).toBe(passwordValue);
    });
  });
});
