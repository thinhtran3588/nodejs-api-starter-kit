import { describe, expect, it } from 'vitest';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import { ValidationException } from '@app/common/utils/exceptions';
import { Username } from '@app/modules/auth/domain/value-objects/username';

describe('Username', () => {
  const validUsername = 'username123';
  const validUsernameMinLength = 'user1234';
  const validUsernameMaxLength = 'username1234567890';
  const validUsernameWithUnderscore = 'user_name123';

  describe('create - happy path', () => {
    it('should create a Username from a valid username string', () => {
      const username = Username.create(validUsername);
      expect(username.getValue()).toBe(validUsername);
    });

    it('should create a Username with minimum length', () => {
      const username = Username.create(validUsernameMinLength);
      expect(username.getValue()).toBe(validUsernameMinLength);
    });

    it('should create a Username with maximum length', () => {
      const username = Username.create(validUsernameMaxLength);
      expect(username.getValue()).toBe(validUsernameMaxLength);
    });

    it('should create a Username with underscores', () => {
      const username = Username.create(validUsernameWithUnderscore);
      expect(username.getValue()).toBe(validUsernameWithUnderscore);
    });

    it('should create a Username with only letters', () => {
      const username = Username.create('username');
      expect(username.getValue()).toBe('username');
    });

    it('should create a Username with only numbers', () => {
      const username = Username.create('12345678');
      expect(username.getValue()).toBe('12345678');
    });

    it('should create a Username with mixed case letters', () => {
      const username = Username.create('UserName123');
      expect(username.getValue()).toBe('UserName123');
    });
  });

  describe('create - validation errors', () => {
    it('should throw ValidationException for username shorter than minimum length', () => {
      expect(() => Username.create('user12')).toThrow(ValidationException);
    });

    it('should throw ValidationException for username longer than maximum length', () => {
      expect(() => Username.create('username1234567890123')).toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException for username with spaces', () => {
      expect(() => Username.create('user name')).toThrow(ValidationException);
    });

    it('should throw ValidationException for username with special characters', () => {
      expect(() => Username.create('user@name')).toThrow(ValidationException);
    });

    it('should throw ValidationException for username with hyphens', () => {
      expect(() => Username.create('user-name')).toThrow(ValidationException);
    });

    it('should throw ValidationException for username with dots', () => {
      expect(() => Username.create('user.name')).toThrow(ValidationException);
    });

    it('should throw ValidationException for empty string', () => {
      expect(() => Username.create('')).toThrow(ValidationException);
    });

    it('should allow username starting with underscore', () => {
      const username = Username.create('_username');
      expect(username.getValue()).toBe('_username');
    });

    it('should throw ValidationException for username with unicode characters', () => {
      expect(() => Username.create('usernamé')).toThrow(ValidationException);
    });
  });

  describe('tryCreate - happy path', () => {
    it('should return username for valid username string', () => {
      const result = Username.tryCreate(validUsername);
      expect(result.username).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.username!.getValue()).toBe(validUsername);
    });

    it('should return username with minimum length', () => {
      const result = Username.tryCreate(validUsernameMinLength);
      expect(result.username).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.username!.getValue()).toBe(validUsernameMinLength);
    });

    it('should return username with maximum length', () => {
      const result = Username.tryCreate(validUsernameMaxLength);
      expect(result.username).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.username!.getValue()).toBe(validUsernameMaxLength);
    });

    it('should return username with underscores', () => {
      const result = Username.tryCreate(validUsernameWithUnderscore);
      expect(result.username).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.username!.getValue()).toBe(validUsernameWithUnderscore);
    });

    it('should return username with only letters', () => {
      const result = Username.tryCreate('username');
      expect(result.username).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return username with only numbers', () => {
      const result = Username.tryCreate('12345678');
      expect(result.username).toBeDefined();
      expect(result.error).toBeUndefined();
    });
  });

  describe('tryCreate - validation errors', () => {
    it('should return error for username shorter than minimum length', () => {
      const result = Username.tryCreate('user12');
      expect(result.username).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_TOO_SHORT);
      expect(result.error!.data?.['field']).toBe('username');
      expect(result.error!.data?.['minLength']).toBe(8);
    });

    it('should return error for username longer than maximum length', () => {
      const result = Username.tryCreate('username1234567890123');
      expect(result.username).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_TOO_LONG);
      expect(result.error!.data?.['field']).toBe('username');
      expect(result.error!.data?.['maxLength']).toBe(20);
    });

    it('should return error for username with spaces', () => {
      const result = Username.tryCreate('user name');
      expect(result.username).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_INVALID);
      expect(result.error!.data?.['field']).toBe('username');
      expect(result.error!.data?.['allowedCharacters']).toBe(
        'letters, numbers, and underscores'
      );
    });

    it('should return error for username with special characters', () => {
      const result = Username.tryCreate('user@name');
      expect(result.username).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_INVALID);
      expect(result.error!.data?.['field']).toBe('username');
      expect(result.error!.data?.['allowedCharacters']).toBe(
        'letters, numbers, and underscores'
      );
    });

    it('should return error for username with hyphens', () => {
      const result = Username.tryCreate('user-name');
      expect(result.username).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_INVALID);
      expect(result.error!.data?.['field']).toBe('username');
    });

    it('should return error for username with dots', () => {
      const result = Username.tryCreate('user.name');
      expect(result.username).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_INVALID);
      expect(result.error!.data?.['field']).toBe('username');
    });

    it('should return error for empty string', () => {
      const result = Username.tryCreate('');
      expect(result.username).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_TOO_SHORT);
      expect(result.error!.data?.['field']).toBe('username');
      expect(result.error!.data?.['minLength']).toBe(8);
    });

    it('should allow username starting with underscore', () => {
      const result = Username.tryCreate('_username');
      expect(result.username).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.username!.getValue()).toBe('_username');
    });

    it('should return error for username with unicode characters', () => {
      const result = Username.tryCreate('usernamé');
      expect(result.username).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_INVALID);
      expect(result.error!.data?.['field']).toBe('username');
    });
  });

  describe('getValue', () => {
    it('should return the username string value', () => {
      const username = Username.create(validUsername);
      expect(username.getValue()).toBe(validUsername);
    });

    it('should return the exact username value without modification', () => {
      const usernameValue = 'UserName123';
      const username = Username.create(usernameValue);
      expect(username.getValue()).toBe(usernameValue);
    });
  });

  describe('equals', () => {
    it('should return true for equal usernames', () => {
      const username1 = Username.create(validUsername);
      const username2 = Username.create(validUsername);
      expect(username1.equals(username2)).toBe(true);
    });

    it('should return false for different usernames', () => {
      const username1 = Username.create(validUsername);
      const username2 = Username.create('different');
      expect(username1.equals(username2)).toBe(false);
    });

    it('should return false for usernames with different case', () => {
      const username1 = Username.create('Username123');
      const username2 = Username.create('username123');
      expect(username1.equals(username2)).toBe(false);
    });

    it('should return true when comparing same username instance', () => {
      const username = Username.create(validUsername);
      expect(username.equals(username)).toBe(true);
    });
  });
});
