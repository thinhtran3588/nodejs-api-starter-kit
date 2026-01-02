import { v5 as uuidv5 } from 'uuid';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { Email } from '@app/modules/auth/domain/value-objects/email';
import { UserIdGeneratorServiceImpl } from '@app/modules/auth/infrastructure/services/user-id-generator.service-impl';

describe('UserIdGeneratorServiceImpl', () => {
  let service: UserIdGeneratorServiceImpl;
  const originalAppCode = process.env['APP_CODE'];

  beforeEach(() => {
    service = new UserIdGeneratorServiceImpl();
  });

  afterEach(() => {
    if (originalAppCode !== undefined) {
      process.env['APP_CODE'] = originalAppCode;
    } else {
      delete process.env['APP_CODE'];
    }
  });

  describe('generateUserId', () => {
    it('should generate a UUID from email', () => {
      const email = Email.create('test@example.com');
      const result = service.generateUserId(email);

      expect(result).toBeInstanceOf(Uuid);
      expect(result.getValue()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should generate same UUID for same email', () => {
      const email = Email.create('test@example.com');
      const result1 = service.generateUserId(email);
      const result2 = service.generateUserId(email);

      expect(result1.getValue()).toBe(result2.getValue());
    });

    it('should generate different UUIDs for different emails', () => {
      const email1 = Email.create('test1@example.com');
      const email2 = Email.create('test2@example.com');
      const result1 = service.generateUserId(email1);
      const result2 = service.generateUserId(email2);

      expect(result1.getValue()).not.toBe(result2.getValue());
    });

    it('should use app code as namespace', () => {
      const email = Email.create('test@example.com');
      const result = service.generateUserId(email);

      const appCode = process.env['APP_CODE'] ?? 'APP_CODE';
      const namespace = uuidv5(appCode, uuidv5.DNS);
      const expectedUuid = uuidv5(email.getValue(), namespace);

      expect(result.getValue()).toBe(expectedUuid);
    });

    it('should use default APP_CODE when environment variable is not set', async () => {
      delete process.env['APP_CODE'];
      vi.resetModules();

      const { UserIdGeneratorServiceImpl: ServiceClass } = await import(
        '@app/modules/auth/infrastructure/services/user-id-generator.service-impl'
      );
      const defaultService = new ServiceClass();

      const email = Email.create('test@example.com');
      const result = defaultService.generateUserId(email);

      const namespace = uuidv5('APP_CODE', uuidv5.DNS);
      const expectedUuid = uuidv5(email.getValue(), namespace);

      expect(result.getValue()).toBe(expectedUuid);
    });

    it('should use custom APP_CODE from environment when set', async () => {
      process.env['APP_CODE'] = 'CUSTOM_APP_CODE';
      vi.resetModules();

      const { UserIdGeneratorServiceImpl: ServiceClass } = await import(
        '@app/modules/auth/infrastructure/services/user-id-generator.service-impl'
      );
      const customService = new ServiceClass();

      const email = Email.create('test@example.com');
      const result = customService.generateUserId(email);

      const namespace = uuidv5('CUSTOM_APP_CODE', uuidv5.DNS);
      const expectedUuid = uuidv5(email.getValue(), namespace);

      expect(result.getValue()).toBe(expectedUuid);
    });

    it('should handle different email formats consistently', () => {
      const email1 = Email.create('Test@Example.com');
      const email2 = Email.create('test@example.com');
      const result1 = service.generateUserId(email1);
      const result2 = service.generateUserId(email2);

      expect(result1.getValue()).toBe(result2.getValue());
    });
  });
});
