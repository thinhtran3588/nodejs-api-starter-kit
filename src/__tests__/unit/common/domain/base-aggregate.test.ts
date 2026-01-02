import { describe, expect, it } from 'vitest';
import {
  BaseAggregate,
  type BaseAggregateParams,
} from '@app/common/domain/base-aggregate';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import { ValidationException } from '@app/common/utils/exceptions';

class TestAggregate extends BaseAggregate {
  constructor(params: BaseAggregateParams) {
    super(params);
  }

  public testUpdateLastModifiedAt(operatorId: Uuid): void {
    this.prepareUpdate(operatorId);
  }

  public toJson(): Record<string, unknown> {
    return {
      id: this.id.getValue(),
      ...this.getBaseJson(),
    };
  }

  public testGetBaseJson(): Record<string, unknown> {
    return this.getBaseJson();
  }

  public testRegisterEvent(
    eventType: string,
    data: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): void {
    this.registerEvent(eventType, data, metadata);
  }
}

describe('BaseAggregate', () => {
  const now = new Date('2024-01-01T00:00:00Z');
  const later = new Date('2024-01-02T00:00:00Z');
  const operatorId = Uuid.create('550e8400-e29b-41d4-a716-446655440999');

  describe('constructor - happy path', () => {
    it('should create aggregate with all properties', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const createdBy = Uuid.create('550e8400-e29b-41d4-a716-446655440001');
      const lastModifiedBy = Uuid.create(
        '550e8400-e29b-41d4-a716-446655440002'
      );
      const params: BaseAggregateParams = {
        id,
        createdAt: now,
        lastModifiedAt: now,
        createdBy,
        lastModifiedBy,
      };

      const aggregate = new TestAggregate(params);

      expect(aggregate.id).toBeInstanceOf(Uuid);
      expect(aggregate.id.getValue()).toBe(id.getValue());
      expect(aggregate.createdAt).toBe(now);
      expect(aggregate.lastModifiedAt).toBe(now);
      expect(aggregate.createdBy).toBe(createdBy);
      expect(aggregate.lastModifiedBy).toBe(lastModifiedBy);
    });

    it('should create aggregate without optional properties', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const params: BaseAggregateParams = {
        id,
        createdAt: now,
        lastModifiedAt: now,
      };

      const aggregate = new TestAggregate(params);

      expect(aggregate.id).toBeInstanceOf(Uuid);
      expect(aggregate.id.getValue()).toBe(id.getValue());
      expect(aggregate.createdAt).toBe(now);
      expect(aggregate.lastModifiedAt).toBe(now);
      expect(aggregate.createdBy).toBeUndefined();
      expect(aggregate.lastModifiedBy).toBeUndefined();
    });

    it('should default createdAt to current date when not provided', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const beforeCreation = new Date();
      const params: BaseAggregateParams = {
        id,
      };

      const aggregate = new TestAggregate(params);
      const afterCreation = new Date();

      expect(aggregate.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime()
      );
      expect(aggregate.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreation.getTime()
      );
      expect(aggregate.version).toBe(0);
    });

    it('should default version to 0 when not provided', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id,
        createdAt: now,
        lastModifiedAt: now,
      });

      expect(aggregate.version).toBe(0);
    });
  });

  describe('getters', () => {
    it('should return id', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id,
        createdAt: now,
        lastModifiedAt: now,
      });

      expect(aggregate.id).toBeInstanceOf(Uuid);
      expect(aggregate.id.getValue()).toBe(id.getValue());
    });

    it('should return createdAt', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id,
        createdAt: now,
        lastModifiedAt: now,
      });

      expect(aggregate.createdAt).toBe(now);
    });

    it('should return lastModifiedAt', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id,
        createdAt: now,
        lastModifiedAt: later,
      });

      expect(aggregate.lastModifiedAt).toBe(later);
    });

    it('should return createdBy when set', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const createdBy = Uuid.create('550e8400-e29b-41d4-a716-446655440001');
      const aggregate = new TestAggregate({
        id,
        createdAt: now,
        lastModifiedAt: now,
        createdBy,
      });

      expect(aggregate.createdBy).toBe(createdBy);
    });

    it('should return undefined for createdBy when not set', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id,
        createdAt: now,
        lastModifiedAt: now,
      });

      expect(aggregate.createdBy).toBeUndefined();
    });

    it('should return lastModifiedBy when set', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const lastModifiedBy = Uuid.create(
        '550e8400-e29b-41d4-a716-446655440002'
      );
      const aggregate = new TestAggregate({
        id,
        createdAt: now,
        lastModifiedAt: now,
        lastModifiedBy,
      });

      expect(aggregate.lastModifiedBy).toBe(lastModifiedBy);
    });

    it('should return undefined for lastModifiedBy when not set', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id,
        createdAt: now,
        lastModifiedAt: now,
      });

      expect(aggregate.lastModifiedBy).toBeUndefined();
    });
  });

  describe('updateLastModifiedAt', () => {
    it('should update lastModifiedAt to current time', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id,
        createdAt: now,
        lastModifiedAt: now,
      });

      const beforeUpdate = aggregate.lastModifiedAt!;
      aggregate.testUpdateLastModifiedAt(operatorId);
      const afterUpdate = aggregate.lastModifiedAt!;

      expect(afterUpdate.getTime()).toBeGreaterThan(beforeUpdate.getTime());
    });

    it('should update lastModifiedAt when called multiple times', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id,
        createdAt: now,
        lastModifiedAt: now,
      });

      aggregate.testUpdateLastModifiedAt(operatorId);
      const firstUpdate = aggregate.lastModifiedAt!;

      aggregate.testUpdateLastModifiedAt(operatorId);
      const secondUpdate = aggregate.lastModifiedAt!;

      expect(secondUpdate.getTime()).toBeGreaterThanOrEqual(
        firstUpdate.getTime()
      );
    });
  });

  describe('updateLastModifiedBy', () => {
    it('should update lastModifiedBy and lastModifiedAt', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id,
        createdAt: now,
        lastModifiedAt: now,
      });

      const beforeUpdate = aggregate.lastModifiedAt!;
      aggregate.prepareUpdate(operatorId);
      const afterUpdate = aggregate.lastModifiedAt!;

      expect(aggregate.lastModifiedBy).toBe(operatorId);
      expect(afterUpdate.getTime()).toBeGreaterThan(beforeUpdate.getTime());
    });

    it('should update lastModifiedBy multiple times', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id,
        createdAt: now,
        lastModifiedAt: now,
      });

      aggregate.prepareUpdate(operatorId);
      expect(aggregate.lastModifiedBy).toBe(operatorId);

      aggregate.prepareUpdate(operatorId);
      expect(aggregate.lastModifiedBy).toBe(operatorId);
    });

    it('should update lastModifiedAt each time lastModifiedBy is updated', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id,
        createdAt: now,
        lastModifiedAt: now,
      });

      aggregate.prepareUpdate(operatorId);
      const firstUpdate = aggregate.lastModifiedAt!;

      aggregate.prepareUpdate(operatorId);
      const secondUpdate = aggregate.lastModifiedAt!;

      expect(secondUpdate.getTime()).toBeGreaterThanOrEqual(
        firstUpdate.getTime()
      );
    });
  });

  describe('prepareUpdate', () => {
    it('should validate version when expectedVersion is provided and matches', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id,
        version: 5,
        createdAt: now,
        lastModifiedAt: now,
      });

      expect(() => {
        aggregate.prepareUpdate(operatorId, 5);
      }).not.toThrow();

      expect(aggregate.version).toBe(6);
      expect(aggregate.updatePrepared).toBe(true);
    });

    it('should throw ValidationException when expectedVersion does not match', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id,
        version: 5,
        createdAt: now,
        lastModifiedAt: now,
      });

      expect(() => {
        aggregate.prepareUpdate(operatorId, 3);
      }).toThrow(ValidationException);

      expect(() => {
        aggregate.prepareUpdate(operatorId, 3);
      }).toThrow(ValidationErrorCode.OUTDATED_VERSION);

      expect(aggregate.version).toBe(5);
      expect(aggregate.updatePrepared).toBe(false);
    });

    it('should not validate version when expectedVersion is not provided', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id,
        version: 5,
        createdAt: now,
        lastModifiedAt: now,
      });

      expect(() => {
        aggregate.prepareUpdate(operatorId);
      }).not.toThrow();

      expect(aggregate.version).toBe(6);
      expect(aggregate.updatePrepared).toBe(true);
    });
  });

  describe('getBaseJson', () => {
    it('should return base json with all fields when all are set', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const createdBy = Uuid.create('550e8400-e29b-41d4-a716-446655440001');
      const lastModifiedBy = Uuid.create(
        '550e8400-e29b-41d4-a716-446655440002'
      );
      const aggregate = new TestAggregate({
        id,
        version: 2,
        createdAt: now,
        lastModifiedAt: later,
        createdBy,
        lastModifiedBy,
      });

      const json = aggregate.testGetBaseJson();

      expect(json['version']).toBe(2);
      expect(json['createdAt']).toBe(now);
      expect(json['lastModifiedAt']).toBe(later);
      expect(json['createdBy']).toBe(createdBy.getValue());
      expect(json['lastModifiedBy']).toBe(lastModifiedBy.getValue());
    });

    it('should return base json with undefined for optional fields when not set', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id,
        version: 1,
        createdAt: now,
        lastModifiedAt: now,
      });

      const json = aggregate.testGetBaseJson();

      expect(json['version']).toBe(1);
      expect(json['createdAt']).toBe(now);
      expect(json['lastModifiedAt']).toBe(now);
      expect(json['createdBy']).toBeUndefined();
      expect(json['lastModifiedBy']).toBeUndefined();
    });

    it('should return base json with only createdBy when lastModifiedBy is not set', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const createdBy = Uuid.create('550e8400-e29b-41d4-a716-446655440001');
      const aggregate = new TestAggregate({
        id,
        version: 1,
        createdAt: now,
        lastModifiedAt: now,
        createdBy,
      });

      const json = aggregate.testGetBaseJson();

      expect(json['createdBy']).toBe(createdBy.getValue());
      expect(json['lastModifiedBy']).toBeUndefined();
    });

    it('should return base json with only lastModifiedBy when createdBy is not set', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const lastModifiedBy = Uuid.create(
        '550e8400-e29b-41d4-a716-446655440002'
      );
      const aggregate = new TestAggregate({
        id,
        version: 1,
        createdAt: now,
        lastModifiedAt: now,
        lastModifiedBy,
      });

      const json = aggregate.testGetBaseJson();

      expect(json['createdBy']).toBeUndefined();
      expect(json['lastModifiedBy']).toBe(lastModifiedBy.getValue());
    });
  });

  describe('updatePrepared flag', () => {
    it('should be false initially', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id,
        createdAt: now,
        lastModifiedAt: now,
      });

      expect(aggregate.updatePrepared).toBe(false);
    });

    it('should be set to true after prepareUpdate is called', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id,
        createdAt: now,
        lastModifiedAt: now,
      });

      expect(aggregate.updatePrepared).toBe(false);

      aggregate.prepareUpdate(operatorId);

      expect(aggregate.updatePrepared).toBe(true);
    });

    it('should remain true after multiple prepareUpdate calls', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id,
        version: 1,
        createdAt: now,
        lastModifiedAt: now,
      });

      aggregate.prepareUpdate(operatorId);
      expect(aggregate.updatePrepared).toBe(true);

      aggregate.prepareUpdate(operatorId);
      expect(aggregate.updatePrepared).toBe(true);
    });
  });

  describe('immutability', () => {
    it('should not allow direct modification of id', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id,
        createdAt: now,
        lastModifiedAt: now,
      });

      expect(() => {
        (aggregate as unknown as { id: Uuid }).id = Uuid.create(
          '650e8400-e29b-41d4-a716-446655440000'
        );
      }).toThrow();
    });

    it('should not allow direct modification of createdAt', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id,
        createdAt: now,
        lastModifiedAt: now,
      });

      expect(() => {
        (aggregate as unknown as { createdAt: Date }).createdAt = later;
      }).toThrow();
    });
  });

  describe('clearEvents', () => {
    it('should clear all registered events', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id,
        createdAt: now,
        lastModifiedAt: now,
      });

      aggregate.testRegisterEvent('TEST_EVENT', { test: 'data' });

      expect(aggregate.getEvents()).toHaveLength(1);

      aggregate.clearEvents();

      expect(aggregate.getEvents()).toHaveLength(0);
      expect(aggregate.getEvents()).toEqual([]);
    });

    it('should clear events when no events are registered', () => {
      const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id,
        createdAt: now,
        lastModifiedAt: now,
      });

      expect(aggregate.getEvents()).toHaveLength(0);

      aggregate.clearEvents();

      expect(aggregate.getEvents()).toHaveLength(0);
      expect(aggregate.getEvents()).toEqual([]);
    });
  });
});
