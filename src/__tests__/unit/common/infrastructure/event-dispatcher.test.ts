import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainEvent } from '@app/common/domain/domain-event';
import type { EventHandler } from '@app/common/domain/interfaces/event-handler';
import type { Logger } from '@app/common/domain/interfaces/logger';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { EventDispatcher } from '@app/common/infrastructure/event-dispatcher';

describe('EventDispatcher', () => {
  let dispatcher: EventDispatcher;
  let mockLogger: Logger;

  beforeEach(() => {
    vi.clearAllMocks();

    mockLogger = {
      trace: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
    } as unknown as Logger;

    dispatcher = new EventDispatcher(mockLogger);
  });

  describe('registerHandler', () => {
    it('should register a handler for a single event type', () => {
      const handler: EventHandler = {
        eventTypes: ['TEST_EVENT'],
        handle: vi.fn().mockResolvedValue(undefined),
      };

      dispatcher.registerHandler(handler);

      expect(handler.handle).not.toHaveBeenCalled();
    });

    it('should register a handler for multiple event types', () => {
      const handler: EventHandler = {
        eventTypes: ['EVENT_TYPE_1', 'EVENT_TYPE_2', 'EVENT_TYPE_3'],
        handle: vi.fn().mockResolvedValue(undefined),
      };

      dispatcher.registerHandler(handler);

      expect(handler.handle).not.toHaveBeenCalled();
    });

    it('should throw error when eventTypes is not provided', () => {
      const handler: EventHandler = {
        handle: vi.fn().mockResolvedValue(undefined),
      } as unknown as EventHandler;

      expect(() => dispatcher.registerHandler(handler)).toThrow(
        'EventHandler must provide eventTypes array with at least one event type'
      );
    });

    it('should throw error when eventTypes is empty array', () => {
      const handler: EventHandler = {
        eventTypes: [],
        handle: vi.fn().mockResolvedValue(undefined),
      } as unknown as EventHandler;

      expect(() => dispatcher.registerHandler(handler)).toThrow(
        'EventHandler must provide eventTypes array with at least one event type'
      );
    });

    it('should register multiple handlers for the same event type', () => {
      const handler1: EventHandler = {
        eventTypes: ['TEST_EVENT'],
        handle: vi.fn().mockResolvedValue(undefined),
      };

      const handler2: EventHandler = {
        eventTypes: ['TEST_EVENT'],
        handle: vi.fn().mockResolvedValue(undefined),
      };

      dispatcher.registerHandler(handler1);
      dispatcher.registerHandler(handler2);

      expect(handler1.handle).not.toHaveBeenCalled();
      expect(handler2.handle).not.toHaveBeenCalled();
    });

    it('should register handlers for different event types', () => {
      const handler1: EventHandler = {
        eventTypes: ['EVENT_TYPE_1'],
        handle: vi.fn().mockResolvedValue(undefined),
      };

      const handler2: EventHandler = {
        eventTypes: ['EVENT_TYPE_2'],
        handle: vi.fn().mockResolvedValue(undefined),
      };

      dispatcher.registerHandler(handler1);
      dispatcher.registerHandler(handler2);

      expect(handler1.handle).not.toHaveBeenCalled();
      expect(handler2.handle).not.toHaveBeenCalled();
    });
  });

  describe('dispatch', () => {
    it('should return immediately when events array is empty', async () => {
      await dispatcher.dispatch([]);

      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should dispatch event to registered handler', async () => {
      const event = new DomainEvent({
        id: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        aggregateId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
        aggregateName: 'TestAggregate',
        eventType: 'TEST_EVENT',
        data: { test: 'data' },
        createdAt: new Date('2024-01-01'),
      });

      const handler: EventHandler = {
        eventTypes: ['TEST_EVENT'],
        handle: vi.fn().mockResolvedValue(undefined),
      };

      dispatcher.registerHandler(handler);

      await dispatcher.dispatch([event]);

      await new Promise((resolve) => setImmediate(resolve));

      expect(handler.handle).toHaveBeenCalledWith(event);
      expect(handler.handle).toHaveBeenCalledTimes(1);
    });

    it('should dispatch event to multiple handlers for same event type', async () => {
      const event = new DomainEvent({
        id: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        aggregateId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
        aggregateName: 'TestAggregate',
        eventType: 'TEST_EVENT',
        data: { test: 'data' },
        createdAt: new Date('2024-01-01'),
      });

      const handler1: EventHandler = {
        eventTypes: ['TEST_EVENT'],
        handle: vi.fn().mockResolvedValue(undefined),
      };

      const handler2: EventHandler = {
        eventTypes: ['TEST_EVENT'],
        handle: vi.fn().mockResolvedValue(undefined),
      };

      dispatcher.registerHandler(handler1);
      dispatcher.registerHandler(handler2);

      await dispatcher.dispatch([event]);

      await new Promise((resolve) => setImmediate(resolve));

      expect(handler1.handle).toHaveBeenCalledWith(event);
      expect(handler2.handle).toHaveBeenCalledWith(event);
      expect(handler1.handle).toHaveBeenCalledTimes(1);
      expect(handler2.handle).toHaveBeenCalledTimes(1);
    });

    it('should dispatch multiple events to their respective handlers', async () => {
      const event1 = new DomainEvent({
        id: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        aggregateId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
        aggregateName: 'TestAggregate',
        eventType: 'EVENT_TYPE_1',
        data: { test: 'data1' },
        createdAt: new Date('2024-01-01'),
      });

      const event2 = new DomainEvent({
        id: Uuid.create('550e8400-e29b-41d4-a716-446655440002'),
        aggregateId: Uuid.create('550e8400-e29b-41d4-a716-446655440003'),
        aggregateName: 'TestAggregate',
        eventType: 'EVENT_TYPE_2',
        data: { test: 'data2' },
        createdAt: new Date('2024-01-01'),
      });

      const handler1: EventHandler = {
        eventTypes: ['EVENT_TYPE_1'],
        handle: vi.fn().mockResolvedValue(undefined),
      };

      const handler2: EventHandler = {
        eventTypes: ['EVENT_TYPE_2'],
        handle: vi.fn().mockResolvedValue(undefined),
      };

      dispatcher.registerHandler(handler1);
      dispatcher.registerHandler(handler2);

      await dispatcher.dispatch([event1, event2]);

      await new Promise((resolve) => setImmediate(resolve));

      expect(handler1.handle).toHaveBeenCalledWith(event1);
      expect(handler2.handle).toHaveBeenCalledWith(event2);
    });

    it('should not dispatch event when no handlers are registered', async () => {
      const event = new DomainEvent({
        id: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        aggregateId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
        aggregateName: 'TestAggregate',
        eventType: 'UNREGISTERED_EVENT',
        data: { test: 'data' },
        createdAt: new Date('2024-01-01'),
      });

      await dispatcher.dispatch([event]);

      await new Promise((resolve) => setImmediate(resolve));

      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should log error when handler throws Error instance', async () => {
      const event = new DomainEvent({
        id: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        aggregateId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
        aggregateName: 'TestAggregate',
        eventType: 'TEST_EVENT',
        data: { test: 'data' },
        createdAt: new Date('2024-01-01'),
      });

      const error = new Error('Handler error');
      error.stack = 'Error stack trace';

      const handler: EventHandler = {
        eventTypes: ['TEST_EVENT'],
        handle: vi.fn().mockRejectedValue(error),
      };

      dispatcher.registerHandler(handler);

      await dispatcher.dispatch([event]);

      await new Promise((resolve) => setImmediate(resolve));

      expect(handler.handle).toHaveBeenCalledWith(event);
      expect(mockLogger.error).toHaveBeenCalledWith(
        {
          eventType: 'TEST_EVENT',
          aggregateId: event.aggregateId.getValue(),
          aggregateName: 'TestAggregate',
          error: 'Handler error',
          stack: 'Error stack trace',
        },
        'Event handler failed for event type TEST_EVENT'
      );
    });

    it('should log error when handler throws non-Error value', async () => {
      const event = new DomainEvent({
        id: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        aggregateId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
        aggregateName: 'TestAggregate',
        eventType: 'TEST_EVENT',
        data: { test: 'data' },
        createdAt: new Date('2024-01-01'),
      });

      const handler: EventHandler = {
        eventTypes: ['TEST_EVENT'],
        handle: vi.fn().mockRejectedValue('String error'),
      };

      dispatcher.registerHandler(handler);

      await dispatcher.dispatch([event]);

      await new Promise((resolve) => setImmediate(resolve));

      expect(handler.handle).toHaveBeenCalledWith(event);
      expect(mockLogger.error).toHaveBeenCalledWith(
        {
          eventType: 'TEST_EVENT',
          aggregateId: event.aggregateId.getValue(),
          aggregateName: 'TestAggregate',
          error: 'String error',
          stack: undefined,
        },
        'Event handler failed for event type TEST_EVENT'
      );
    });

    it('should continue processing other handlers when one handler fails', async () => {
      const event = new DomainEvent({
        id: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        aggregateId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
        aggregateName: 'TestAggregate',
        eventType: 'TEST_EVENT',
        data: { test: 'data' },
        createdAt: new Date('2024-01-01'),
      });

      const handler1: EventHandler = {
        eventTypes: ['TEST_EVENT'],
        handle: vi.fn().mockRejectedValue(new Error('Handler 1 error')),
      };

      const handler2: EventHandler = {
        eventTypes: ['TEST_EVENT'],
        handle: vi.fn().mockResolvedValue(undefined),
      };

      dispatcher.registerHandler(handler1);
      dispatcher.registerHandler(handler2);

      await dispatcher.dispatch([event]);

      await new Promise((resolve) => setImmediate(resolve));

      expect(handler1.handle).toHaveBeenCalledWith(event);
      expect(handler2.handle).toHaveBeenCalledWith(event);
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
    });

    it('should dispatch event to multi-event handler when event type matches', async () => {
      const event = new DomainEvent({
        id: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        aggregateId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
        aggregateName: 'TestAggregate',
        eventType: 'EVENT_TYPE_2',
        data: { test: 'data' },
        createdAt: new Date('2024-01-01'),
      });

      const handler: EventHandler = {
        eventTypes: ['EVENT_TYPE_1', 'EVENT_TYPE_2', 'EVENT_TYPE_3'],
        handle: vi.fn().mockResolvedValue(undefined),
      };

      dispatcher.registerHandler(handler);

      await dispatcher.dispatch([event]);

      await new Promise((resolve) => setImmediate(resolve));

      expect(handler.handle).toHaveBeenCalledWith(event);
      expect(handler.handle).toHaveBeenCalledTimes(1);
    });

    it('should dispatch multiple events to multi-event handler', async () => {
      const event1 = new DomainEvent({
        id: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        aggregateId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
        aggregateName: 'TestAggregate',
        eventType: 'EVENT_TYPE_1',
        data: { test: 'data1' },
        createdAt: new Date('2024-01-01'),
      });

      const event2 = new DomainEvent({
        id: Uuid.create('550e8400-e29b-41d4-a716-446655440002'),
        aggregateId: Uuid.create('550e8400-e29b-41d4-a716-446655440003'),
        aggregateName: 'TestAggregate',
        eventType: 'EVENT_TYPE_2',
        data: { test: 'data2' },
        createdAt: new Date('2024-01-01'),
      });

      const handler: EventHandler = {
        eventTypes: ['EVENT_TYPE_1', 'EVENT_TYPE_2'],
        handle: vi.fn().mockResolvedValue(undefined),
      };

      dispatcher.registerHandler(handler);

      await dispatcher.dispatch([event1, event2]);

      await new Promise((resolve) => setImmediate(resolve));

      expect(handler.handle).toHaveBeenCalledWith(event1);
      expect(handler.handle).toHaveBeenCalledWith(event2);
      expect(handler.handle).toHaveBeenCalledTimes(2);
    });

    it('should not dispatch event to multi-event handler when event type does not match', async () => {
      const event = new DomainEvent({
        id: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        aggregateId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
        aggregateName: 'TestAggregate',
        eventType: 'UNMATCHED_EVENT',
        data: { test: 'data' },
        createdAt: new Date('2024-01-01'),
      });

      const handler: EventHandler = {
        eventTypes: ['EVENT_TYPE_1', 'EVENT_TYPE_2'],
        handle: vi.fn().mockResolvedValue(undefined),
      };

      dispatcher.registerHandler(handler);

      await dispatcher.dispatch([event]);

      await new Promise((resolve) => setImmediate(resolve));

      expect(handler.handle).not.toHaveBeenCalled();
    });

    it('should support both single-event and multi-event handlers for same event type', async () => {
      const event = new DomainEvent({
        id: Uuid.create('550e8400-e29b-41d4-a716-446655440000'),
        aggregateId: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
        aggregateName: 'TestAggregate',
        eventType: 'SHARED_EVENT',
        data: { test: 'data' },
        createdAt: new Date('2024-01-01'),
      });

      const singleHandler: EventHandler = {
        eventTypes: ['SHARED_EVENT'],
        handle: vi.fn().mockResolvedValue(undefined),
      };

      const multiHandler: EventHandler = {
        eventTypes: ['SHARED_EVENT', 'OTHER_EVENT'],
        handle: vi.fn().mockResolvedValue(undefined),
      };

      dispatcher.registerHandler(singleHandler);
      dispatcher.registerHandler(multiHandler);

      await dispatcher.dispatch([event]);

      await new Promise((resolve) => setImmediate(resolve));

      expect(singleHandler.handle).toHaveBeenCalledWith(event);
      expect(multiHandler.handle).toHaveBeenCalledWith(event);
      expect(singleHandler.handle).toHaveBeenCalledTimes(1);
      expect(multiHandler.handle).toHaveBeenCalledTimes(1);
    });
  });
});
