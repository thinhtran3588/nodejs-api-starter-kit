import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainEvent } from '@app/common/domain/domain-event';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { UserRegisteredHandler } from '@app/modules/auth/application/event-handlers/user-registered.event-handler';
import { UserEventType } from '@app/modules/auth/domain/enums/user-event-type';

describe('UserRegisteredHandler', () => {
  let handler: UserRegisteredHandler;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new UserRegisteredHandler();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('eventTypes', () => {
    it('should have correct event types', () => {
      expect(handler.eventTypes).toEqual([UserEventType.REGISTERED]);
    });
  });

  describe('handle', () => {
    it('should handle user registered event with email and username', async () => {
      const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const event = new DomainEvent({
        id: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
        aggregateId: userId,
        aggregateName: 'User',
        eventType: UserEventType.REGISTERED,
        data: {
          email: 'test@example.com',
          username: 'testuser123',
        },
        createdAt: new Date('2024-01-01'),
      });

      await handler.handle(event);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'User registered: 550e8400-e29b-41d4-a716-446655440000, email: test@example.com, username: testuser123'
      );
    });

    it('should handle user registered event with email only (no username)', async () => {
      const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const event = new DomainEvent({
        id: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
        aggregateId: userId,
        aggregateName: 'User',
        eventType: UserEventType.REGISTERED,
        data: {
          email: 'test@example.com',
        },
        createdAt: new Date('2024-01-01'),
      });

      await handler.handle(event);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'User registered: 550e8400-e29b-41d4-a716-446655440000, email: test@example.com, username: undefined'
      );
    });

    it('should return resolved promise', async () => {
      const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const event = new DomainEvent({
        id: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
        aggregateId: userId,
        aggregateName: 'User',
        eventType: UserEventType.REGISTERED,
        data: {
          email: 'test@example.com',
          username: 'testuser123',
        },
        createdAt: new Date('2024-01-01'),
      });

      const result = await handler.handle(event);

      expect(result).toBeUndefined();
    });
  });
});
