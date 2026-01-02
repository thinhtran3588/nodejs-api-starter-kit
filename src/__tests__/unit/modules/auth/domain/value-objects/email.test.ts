import { describe, expect, it } from 'vitest';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import { ValidationException } from '@app/common/utils/exceptions';
import { Email } from '@app/modules/auth/domain/value-objects/email';

describe('Email', () => {
  const validEmail = 'test@example.com';
  const anotherValidEmail = 'user@domain.co.uk';
  const validEmailWithPlus = 'user+tag@example.com';
  const validEmailWithDots = 'user.name@example.com';

  describe('create - happy path', () => {
    it('should create an Email from a valid email string', () => {
      const email = Email.create(validEmail);
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should lowercase the email value', () => {
      const email = Email.create('TEST@EXAMPLE.COM');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should trim whitespace from email string', () => {
      const email = Email.create(`  ${validEmail}  `);
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should handle emails with plus signs', () => {
      const email = Email.create(validEmailWithPlus);
      expect(email.getValue()).toBe('user+tag@example.com');
    });

    it('should handle emails with dots', () => {
      const email = Email.create(validEmailWithDots);
      expect(email.getValue()).toBe('user.name@example.com');
    });

    it('should handle emails with multiple domain segments', () => {
      const email = Email.create(anotherValidEmail);
      expect(email.getValue()).toBe('user@domain.co.uk');
    });
  });

  describe('create - validation errors', () => {
    it('should throw ValidationException for undefined value', () => {
      expect(() => Email.create(undefined as unknown as string)).toThrow();
    });

    it('should throw ValidationException for null value', () => {
      expect(() => Email.create(null as unknown as string)).toThrow();
    });

    it('should throw ValidationException for empty string', () => {
      expect(() => Email.create('')).toThrow(ValidationException);
    });

    it('should throw ValidationException for whitespace-only string', () => {
      expect(() => Email.create('   ')).toThrow(ValidationException);
    });

    it('should throw ValidationException for invalid email format - missing @', () => {
      expect(() => Email.create('invalidemail.com')).toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException for invalid email format - missing domain', () => {
      expect(() => Email.create('user@')).toThrow(ValidationException);
    });

    it('should throw ValidationException for invalid email format - missing local part', () => {
      expect(() => Email.create('@example.com')).toThrow(ValidationException);
    });

    it('should throw ValidationException for invalid email format - multiple @', () => {
      expect(() => Email.create('user@@example.com')).toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException for invalid email format - invalid characters', () => {
      expect(() => Email.create('user name@example.com')).toThrow(
        ValidationException
      );
    });

    it('should throw ValidationException for invalid email format - too short domain', () => {
      expect(() => Email.create('user@ex.c')).toThrow(ValidationException);
    });
  });

  describe('tryCreate - happy path', () => {
    it('should return email for valid email string', () => {
      const result = Email.tryCreate(validEmail);
      expect(result.email).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.email!.getValue()).toBe('test@example.com');
    });

    it('should lowercase the email value', () => {
      const result = Email.tryCreate('TEST@EXAMPLE.COM');
      expect(result.email).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.email!.getValue()).toBe('test@example.com');
    });

    it('should trim whitespace from email string', () => {
      const result = Email.tryCreate(`  ${validEmail}  `);
      expect(result.email).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.email!.getValue()).toBe('test@example.com');
    });

    it('should handle emails with plus signs', () => {
      const result = Email.tryCreate(validEmailWithPlus);
      expect(result.email).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.email!.getValue()).toBe('user+tag@example.com');
    });

    it('should handle emails with dots', () => {
      const result = Email.tryCreate(validEmailWithDots);
      expect(result.email).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.email!.getValue()).toBe('user.name@example.com');
    });
  });

  describe('tryCreate - validation errors', () => {
    it('should throw error for undefined value', () => {
      expect(() => Email.tryCreate(undefined as unknown as string)).toThrow();
    });

    it('should throw error for null value', () => {
      expect(() => Email.tryCreate(null as unknown as string)).toThrow();
    });

    it('should return error for empty string', () => {
      const result = Email.tryCreate('');
      expect(result.email).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_REQUIRED);
      expect(result.error!.data?.['field']).toBe('email');
    });

    it('should return error for whitespace-only string', () => {
      const result = Email.tryCreate('   ');
      expect(result.email).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_REQUIRED);
      expect(result.error!.data?.['field']).toBe('email');
    });

    it('should return error for invalid email format - missing @', () => {
      const result = Email.tryCreate('invalidemail.com');
      expect(result.email).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_INVALID);
      expect(result.error!.data?.['field']).toBe('email');
    });

    it('should return error for invalid email format - missing domain', () => {
      const result = Email.tryCreate('user@');
      expect(result.email).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_INVALID);
      expect(result.error!.data?.['field']).toBe('email');
    });

    it('should return error for invalid email format - missing local part', () => {
      const result = Email.tryCreate('@example.com');
      expect(result.email).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_INVALID);
      expect(result.error!.data?.['field']).toBe('email');
    });

    it('should return error for invalid email format - multiple @', () => {
      const result = Email.tryCreate('user@@example.com');
      expect(result.email).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_INVALID);
      expect(result.error!.data?.['field']).toBe('email');
    });

    it('should return error for invalid email format - invalid characters', () => {
      const result = Email.tryCreate('user name@example.com');
      expect(result.email).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_INVALID);
      expect(result.error!.data?.['field']).toBe('email');
    });

    it('should return error for invalid email format - too short domain', () => {
      const result = Email.tryCreate('user@ex.c');
      expect(result.email).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_INVALID);
      expect(result.error!.data?.['field']).toBe('email');
    });
  });

  describe('getValue', () => {
    it('should return the email string value', () => {
      const email = Email.create(validEmail);
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should return lowercased email value', () => {
      const email = Email.create('TEST@EXAMPLE.COM');
      expect(email.getValue()).toBe('test@example.com');
    });
  });

  describe('equals', () => {
    it('should return true for equal emails (case-insensitive)', () => {
      const email1 = Email.create(validEmail);
      const email2 = Email.create(validEmail);
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return true for emails with different case', () => {
      const email1 = Email.create('TEST@EXAMPLE.COM');
      const email2 = Email.create('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = Email.create(validEmail);
      const email2 = Email.create(anotherValidEmail);
      expect(email1.equals(email2)).toBe(false);
    });

    it('should return true when comparing same email with different case in local part', () => {
      const email1 = Email.create('User@example.com');
      const email2 = Email.create('user@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return true when comparing same email with different case in domain', () => {
      const email1 = Email.create('user@EXAMPLE.com');
      const email2 = Email.create('user@example.com');
      expect(email1.equals(email2)).toBe(true);
    });
  });
});
