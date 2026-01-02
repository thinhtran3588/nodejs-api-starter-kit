import { beforeEach, describe, expect, it } from 'vitest';
import { ErrorCodeRegistry } from '@app/common/utils/error-code-registry';

describe('ErrorCodeRegistry', () => {
  let registry: ErrorCodeRegistry;

  beforeEach(() => {
    registry = new ErrorCodeRegistry();
  });

  describe('register - happy path', () => {
    it('should register error code mappings', () => {
      registry.register({
        ERROR_1: 400,
        ERROR_2: 404,
        ERROR_3: 500,
      });

      expect(registry.getStatusCode('ERROR_1')).toBe(400);
      expect(registry.getStatusCode('ERROR_2')).toBe(404);
      expect(registry.getStatusCode('ERROR_3')).toBe(500);
    });

    it('should merge multiple registrations', () => {
      registry.register({
        ERROR_1: 400,
        ERROR_2: 404,
      });

      registry.register({
        ERROR_3: 500,
        ERROR_4: 403,
      });

      expect(registry.getStatusCode('ERROR_1')).toBe(400);
      expect(registry.getStatusCode('ERROR_2')).toBe(404);
      expect(registry.getStatusCode('ERROR_3')).toBe(500);
      expect(registry.getStatusCode('ERROR_4')).toBe(403);
    });

    it('should overwrite existing mappings when registering same code', () => {
      registry.register({
        ERROR_1: 400,
      });

      registry.register({
        ERROR_1: 500,
      });

      expect(registry.getStatusCode('ERROR_1')).toBe(500);
    });

    it('should handle empty mappings object', () => {
      registry.register({});
      expect(registry.getAllMappings()).toEqual({});
    });
  });

  describe('getStatusCode - happy path', () => {
    it('should return status code for registered error code', () => {
      registry.register({
        ERROR_1: 400,
        ERROR_2: 404,
      });

      expect(registry.getStatusCode('ERROR_1')).toBe(400);
      expect(registry.getStatusCode('ERROR_2')).toBe(404);
    });

    it('should return undefined for unregistered error code', () => {
      registry.register({
        ERROR_1: 400,
      });

      expect(registry.getStatusCode('ERROR_2')).toBeUndefined();
      expect(registry.getStatusCode('UNKNOWN_ERROR')).toBeUndefined();
    });

    it('should return undefined when no mappings registered', () => {
      expect(registry.getStatusCode('ERROR_1')).toBeUndefined();
    });
  });

  describe('getAllMappings - happy path', () => {
    it('should return all registered mappings', () => {
      registry.register({
        ERROR_1: 400,
        ERROR_2: 404,
        ERROR_3: 500,
      });

      const mappings = registry.getAllMappings();

      expect(mappings).toEqual({
        ERROR_1: 400,
        ERROR_2: 404,
        ERROR_3: 500,
      });
    });

    it('should return empty object when no mappings registered', () => {
      const mappings = registry.getAllMappings();
      expect(mappings).toEqual({});
    });

    it('should return a copy of mappings, not the original', () => {
      registry.register({
        ERROR_1: 400,
      });

      const mappings = registry.getAllMappings();
      mappings['ERROR_1'] = 500;

      expect(registry.getStatusCode('ERROR_1')).toBe(400);
    });

    it('should reflect updates after additional registrations', () => {
      registry.register({
        ERROR_1: 400,
      });

      const mappings1 = registry.getAllMappings();
      expect(mappings1).toEqual({ ERROR_1: 400 });

      registry.register({
        ERROR_2: 404,
      });

      const mappings2 = registry.getAllMappings();
      expect(mappings2).toEqual({
        ERROR_1: 400,
        ERROR_2: 404,
      });
    });
  });
});
