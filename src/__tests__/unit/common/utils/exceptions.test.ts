import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BusinessException,
  ValidationException,
} from '@app/common/utils/exceptions';

describe('BusinessException', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor - happy path', () => {
    it('should create exception with code only', () => {
      const exception = new BusinessException('ERROR_CODE');

      expect(exception.code).toBe('ERROR_CODE');
      expect(exception.message).toBe('ERROR_CODE');
      expect(exception.name).toBe('BusinessException');
      expect(exception.data).toBeUndefined();
    });

    it('should create exception with code and data', () => {
      const data = { userId: 'user-123', reason: 'test' };
      const exception = new BusinessException('ERROR_CODE', data);

      expect(exception.code).toBe('ERROR_CODE');
      expect(exception.message).toBe('ERROR_CODE');
      expect(exception.name).toBe('BusinessException');
      expect(exception.data).toEqual(data);
    });

    it('should create exception with code, data, and custom message', () => {
      const data = { userId: 'user-123' };
      const exception = new BusinessException(
        'ERROR_CODE',
        data,
        'Custom error message'
      );

      expect(exception.code).toBe('ERROR_CODE');
      expect(exception.message).toBe('Custom error message');
      expect(exception.name).toBe('BusinessException');
      expect(exception.data).toEqual(data);
    });

    it('should create exception with code and custom message without data', () => {
      const exception = new BusinessException(
        'ERROR_CODE',
        undefined,
        'Custom error message'
      );

      expect(exception.code).toBe('ERROR_CODE');
      expect(exception.message).toBe('Custom error message');
      expect(exception.name).toBe('BusinessException');
      expect(exception.data).toBeUndefined();
    });
  });

  describe('instanceof and inheritance', () => {
    it('should be instance of Error', () => {
      const exception = new BusinessException('ERROR_CODE');
      expect(exception).toBeInstanceOf(Error);
    });

    it('should be instance of BusinessException', () => {
      const exception = new BusinessException('ERROR_CODE');
      expect(exception).toBeInstanceOf(BusinessException);
    });

    it('should have stack trace', () => {
      const exception = new BusinessException('ERROR_CODE');
      expect(exception.stack).toBeDefined();
      expect(typeof exception.stack).toBe('string');
    });
  });

  describe('readonly properties', () => {
    it('should have readonly code property', () => {
      const exception = new BusinessException('ERROR_CODE');
      expect(exception.code).toBe('ERROR_CODE');
    });

    it('should have readonly data property', () => {
      const data = { userId: 'user-123' };
      const exception = new BusinessException('ERROR_CODE', data);
      expect(exception.data).toEqual(data);
    });
  });

  describe('Error.captureStackTrace handling', () => {
    it('should handle case when Error.captureStackTrace is not available', () => {
      const originalCaptureStackTrace = Error.captureStackTrace;
      delete (Error as { captureStackTrace?: typeof Error.captureStackTrace })
        .captureStackTrace;

      const exception = new BusinessException('ERROR_CODE');

      expect(exception.code).toBe('ERROR_CODE');
      expect(exception.name).toBe('BusinessException');
      expect(exception.stack).toBeDefined();

      Error.captureStackTrace = originalCaptureStackTrace;
    });
  });
});

describe('ValidationException', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor - happy path', () => {
    it('should create exception with code only', () => {
      const exception = new ValidationException('VALIDATION_ERROR');

      expect(exception.code).toBe('VALIDATION_ERROR');
      expect(exception.message).toBe('VALIDATION_ERROR');
      expect(exception.name).toBe('ValidationException');
      expect(exception.data).toBeUndefined();
    });

    it('should create exception with code and data', () => {
      const data = { field: 'email', reason: 'invalid format' };
      const exception = new ValidationException('VALIDATION_ERROR', data);

      expect(exception.code).toBe('VALIDATION_ERROR');
      expect(exception.message).toBe('VALIDATION_ERROR');
      expect(exception.name).toBe('ValidationException');
      expect(exception.data).toEqual(data);
    });

    it('should create exception with code, data, and custom message', () => {
      const data = { field: 'email' };
      const exception = new ValidationException(
        'VALIDATION_ERROR',
        data,
        'Invalid email format'
      );

      expect(exception.code).toBe('VALIDATION_ERROR');
      expect(exception.message).toBe('Invalid email format');
      expect(exception.name).toBe('ValidationException');
      expect(exception.data).toEqual(data);
    });
  });

  describe('inheritance from BusinessException', () => {
    it('should be instance of BusinessException', () => {
      const exception = new ValidationException('VALIDATION_ERROR');
      expect(exception).toBeInstanceOf(BusinessException);
    });

    it('should be instance of Error', () => {
      const exception = new ValidationException('VALIDATION_ERROR');
      expect(exception).toBeInstanceOf(Error);
    });

    it('should be instance of ValidationException', () => {
      const exception = new ValidationException('VALIDATION_ERROR');
      expect(exception).toBeInstanceOf(ValidationException);
    });

    it('should have stack trace', () => {
      const exception = new ValidationException('VALIDATION_ERROR');
      expect(exception.stack).toBeDefined();
      expect(typeof exception.stack).toBe('string');
    });

    it('should inherit code and data properties', () => {
      const data = { field: 'email' };
      const exception = new ValidationException('VALIDATION_ERROR', data);

      expect(exception.code).toBe('VALIDATION_ERROR');
      expect(exception.data).toEqual(data);
    });
  });

  describe('name property', () => {
    it('should have name set to ValidationException', () => {
      const exception = new ValidationException('VALIDATION_ERROR');
      expect(exception.name).toBe('ValidationException');
    });
  });

  describe('Error.captureStackTrace handling', () => {
    it('should handle case when Error.captureStackTrace is not available', () => {
      const originalCaptureStackTrace = Error.captureStackTrace;
      delete (Error as { captureStackTrace?: typeof Error.captureStackTrace })
        .captureStackTrace;

      const exception = new ValidationException('VALIDATION_ERROR');

      expect(exception.code).toBe('VALIDATION_ERROR');
      expect(exception.name).toBe('ValidationException');
      expect(exception.stack).toBeDefined();

      Error.captureStackTrace = originalCaptureStackTrace;
    });
  });
});
