import { describe, expect, it } from 'vitest';
import type { BaseAggregateParams } from '@app/common/domain/base-aggregate';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { extractBaseAggregateParams } from '@app/common/infrastructure/repositories/extract-base-aggregate-params';

describe('extractBaseAggregateParams', () => {
  const idString = '550e8400-e29b-41d4-a716-446655440000';
  const createdByString = '550e8400-e29b-41d4-a716-446655440001';
  const lastModifiedByString = '550e8400-e29b-41d4-a716-446655440002';
  const createdAt = new Date('2024-01-01T00:00:00Z');
  const lastModifiedAt = new Date('2024-01-02T00:00:00Z');

  describe('happy path', () => {
    it('should extract all base aggregate fields from model', () => {
      const model = {
        id: idString,
        version: 1,
        createdAt,
        lastModifiedAt,
        createdBy: createdByString,
        lastModifiedBy: lastModifiedByString,
      };

      const result = extractBaseAggregateParams(model);

      expect(result).toMatchObject({
        id: expect.any(Uuid),
        version: 1,
        createdAt,
        lastModifiedAt,
        createdBy: expect.any(Uuid),
        lastModifiedBy: expect.any(Uuid),
      });
      expect(result.id.getValue()).toBe(idString);
      expect(result.createdBy?.getValue()).toBe(createdByString);
      expect(result.lastModifiedBy?.getValue()).toBe(lastModifiedByString);
    });

    it('should extract base fields without optional properties', () => {
      const model = {
        id: idString,
        createdAt,
      };

      const result = extractBaseAggregateParams(model);

      expect(result).toMatchObject({
        id: expect.any(Uuid),
        version: 0,
        createdAt,
        lastModifiedAt: undefined,
        createdBy: undefined,
        lastModifiedBy: undefined,
      });
      expect(result.id.getValue()).toBe(idString);
    });
  });

  describe('version handling', () => {
    it('should default version to 0 when null', () => {
      const model = {
        id: idString,
        version: null,
        createdAt,
      };

      const result = extractBaseAggregateParams(model);

      expect(result.version).toBe(0);
    });

    it('should default version to 0 when undefined', () => {
      const model = {
        id: idString,
        createdAt,
      };

      const result = extractBaseAggregateParams(model);

      expect(result.version).toBe(0);
    });

    it('should use provided version when set', () => {
      const model = {
        id: idString,
        version: 5,
        createdAt,
      };

      const result = extractBaseAggregateParams(model);

      expect(result.version).toBe(5);
    });
  });

  describe('timestamp handling', () => {
    it('should handle null lastModifiedAt', () => {
      const model = {
        id: idString,
        createdAt,
        lastModifiedAt: null,
      };

      const result = extractBaseAggregateParams(model);

      expect(result.lastModifiedAt).toBeUndefined();
    });

    it('should handle undefined lastModifiedAt', () => {
      const model = {
        id: idString,
        createdAt,
      };

      const result = extractBaseAggregateParams(model);

      expect(result.lastModifiedAt).toBeUndefined();
    });

    it('should use provided lastModifiedAt when set', () => {
      const model = {
        id: idString,
        createdAt,
        lastModifiedAt,
      };

      const result = extractBaseAggregateParams(model);

      expect(result.lastModifiedAt).toBe(lastModifiedAt);
    });
  });

  describe('audit field handling', () => {
    it('should handle null createdBy', () => {
      const model = {
        id: idString,
        createdAt,
        createdBy: null,
      };

      const result = extractBaseAggregateParams(model);

      expect(result.createdBy).toBeUndefined();
    });

    it('should handle undefined createdBy', () => {
      const model = {
        id: idString,
        createdAt,
      };

      const result = extractBaseAggregateParams(model);

      expect(result.createdBy).toBeUndefined();
    });

    it('should convert createdBy string to Uuid when provided', () => {
      const model = {
        id: idString,
        createdAt,
        createdBy: createdByString,
      };

      const result = extractBaseAggregateParams(model);

      expect(result.createdBy).toBeInstanceOf(Uuid);
      expect(result.createdBy?.getValue()).toBe(createdByString);
    });

    it('should handle null lastModifiedBy', () => {
      const model = {
        id: idString,
        createdAt,
        lastModifiedBy: null,
      };

      const result = extractBaseAggregateParams(model);

      expect(result.lastModifiedBy).toBeUndefined();
    });

    it('should handle undefined lastModifiedBy', () => {
      const model = {
        id: idString,
        createdAt,
      };

      const result = extractBaseAggregateParams(model);

      expect(result.lastModifiedBy).toBeUndefined();
    });

    it('should convert lastModifiedBy string to Uuid when provided', () => {
      const model = {
        id: idString,
        createdAt,
        lastModifiedBy: lastModifiedByString,
      };

      const result = extractBaseAggregateParams(model);

      expect(result.lastModifiedBy).toBeInstanceOf(Uuid);
      expect(result.lastModifiedBy?.getValue()).toBe(lastModifiedByString);
    });
  });

  describe('id handling', () => {
    it('should convert id string to Uuid', () => {
      const model = {
        id: idString,
        createdAt,
      };

      const result = extractBaseAggregateParams(model);

      expect(result.id).toBeInstanceOf(Uuid);
      expect(result.id.getValue()).toBe(idString);
    });
  });

  describe('type safety', () => {
    it('should return correct type that matches BaseAggregateParams', () => {
      const model = {
        id: idString,
        version: 1,
        createdAt,
        lastModifiedAt,
        createdBy: createdByString,
        lastModifiedBy: lastModifiedByString,
      };

      const result = extractBaseAggregateParams(model);

      const params: BaseAggregateParams = {
        ...result,
        // This should compile without errors if types are correct
      };

      expect(params.id).toBeInstanceOf(Uuid);
      expect(params.version).toBe(1);
      expect(params.createdAt).toBe(createdAt);
      expect(params.lastModifiedAt).toBe(lastModifiedAt);
      expect(params.createdBy).toBeInstanceOf(Uuid);
      expect(params.lastModifiedBy).toBeInstanceOf(Uuid);
    });
  });
});
