import { describe, expect, it } from 'vitest';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import { ValidationException } from '@app/common/utils/exceptions';

describe('Uuid', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';
  const anotherValidUuid = '550e8400-e29b-41d4-a716-446655440001';

  describe('create - happy path', () => {
    it('should create a Uuid from a valid UUID string', () => {
      const uuid = Uuid.create(validUuid);
      expect(uuid.getValue()).toBe(validUuid);
    });

    it('should create a Uuid with custom field name', () => {
      const uuid = Uuid.create(validUuid, 'userId');
      expect(uuid.getValue()).toBe(validUuid);
    });

    it('should trim whitespace from UUID string', () => {
      const uuid = Uuid.create(`  ${validUuid}  `);
      expect(uuid.getValue()).toBe(validUuid);
    });
  });

  describe('create - validation errors', () => {
    it('should throw ValidationException for undefined value', () => {
      expect(() => Uuid.create(undefined)).toThrow(ValidationException);
    });

    it('should throw ValidationException for null value', () => {
      expect(() => Uuid.create(null)).toThrow(ValidationException);
    });

    it('should throw ValidationException for empty string', () => {
      expect(() => Uuid.create('')).toThrow(ValidationException);
    });

    it('should throw ValidationException for whitespace-only string', () => {
      expect(() => Uuid.create('   ')).toThrow(ValidationException);
    });

    it('should throw ValidationException for invalid UUID format', () => {
      expect(() => Uuid.create('not-a-uuid')).toThrow(ValidationException);
    });

    it('should throw ValidationException for non-string value', () => {
      expect(() => Uuid.create(123 as unknown as string)).toThrow(
        ValidationException
      );
    });

    it('should include custom field name in error', () => {
      try {
        Uuid.create(undefined, 'userId');
        expect.fail('Should have thrown ValidationException');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
      }
    });
  });

  describe('tryCreate - happy path', () => {
    it('should return uuid for valid UUID string', () => {
      const result = Uuid.tryCreate(validUuid);
      expect(result.uuid).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.uuid!.getValue()).toBe(validUuid);
    });

    it('should return uuid with custom field name', () => {
      const result = Uuid.tryCreate(validUuid, 'userId');
      expect(result.uuid).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should trim whitespace from UUID string', () => {
      const result = Uuid.tryCreate(`  ${validUuid}  `);
      expect(result.uuid).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.uuid!.getValue()).toBe(validUuid);
    });
  });

  describe('tryCreate - validation errors', () => {
    it('should return error for undefined value', () => {
      const result = Uuid.tryCreate(undefined);
      expect(result.uuid).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_REQUIRED);
    });

    it('should return error for null value', () => {
      const result = Uuid.tryCreate(null);
      expect(result.uuid).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_REQUIRED);
    });

    it('should return error for empty string', () => {
      const result = Uuid.tryCreate('');
      expect(result.uuid).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_REQUIRED);
    });

    it('should return error for whitespace-only string', () => {
      const result = Uuid.tryCreate('   ');
      expect(result.uuid).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_REQUIRED);
    });

    it('should return error for invalid UUID format', () => {
      const result = Uuid.tryCreate('not-a-uuid');
      expect(result.uuid).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_INVALID);
    });

    it('should return error for non-string value', () => {
      const result = Uuid.tryCreate(123 as unknown as string);
      expect(result.uuid).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(ValidationErrorCode.FIELD_IS_INVALID);
    });

    it('should include custom field name in error data', () => {
      const result = Uuid.tryCreate(undefined, 'userId');
      expect(result.error).toBeDefined();
      expect(result.error!.data?.['field']).toBe('userId');
    });
  });

  describe('getValue', () => {
    it('should return the UUID string value', () => {
      const uuid = Uuid.create(validUuid);
      expect(uuid.getValue()).toBe(validUuid);
    });
  });

  describe('equals', () => {
    it('should return true for equal UUIDs', () => {
      const uuid1 = Uuid.create(validUuid);
      const uuid2 = Uuid.create(validUuid);
      expect(uuid1.equals(uuid2)).toBe(true);
    });

    it('should return false for different UUIDs', () => {
      const uuid1 = Uuid.create(validUuid);
      const uuid2 = Uuid.create(anotherValidUuid);
      expect(uuid1.equals(uuid2)).toBe(false);
    });
  });
});
