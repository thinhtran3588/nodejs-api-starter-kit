import type { Transaction } from 'sequelize';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainEvent } from '@app/common/domain/domain-event';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { DomainEventModel } from '@app/common/infrastructure/models/domain-event.model';
import { SequelizeDomainEventRepository } from '@app/common/infrastructure/repositories/domain-event.repository-impl';
import { UserEventType } from '@app/modules/auth/domain/enums/user-event-type';

vi.mock('@app/common/infrastructure/models/domain-event.model');

describe('SequelizeDomainEventRepository', () => {
  let repository: SequelizeDomainEventRepository;
  let mockTransaction: Transaction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockTransaction = {
      commit: vi.fn().mockResolvedValue(undefined),
      rollback: vi.fn().mockResolvedValue(undefined),
    } as unknown as Transaction;

    repository = new SequelizeDomainEventRepository();
  });

  describe('save', () => {
    it('should save domain events to database', async () => {
      const aggregateId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const event1 = new DomainEvent({
        id: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
        aggregateId,
        aggregateName: 'User',
        eventType: UserEventType.REGISTERED,
        data: { email: 'test@example.com' },
        createdAt: new Date('2024-01-01'),
      });

      const event2 = new DomainEvent({
        id: Uuid.create('550e8400-e29b-41d4-a716-446655440002'),
        aggregateId,
        aggregateName: 'User',
        eventType: UserEventType.REGISTERED,
        data: { email: 'test2@example.com' },
        createdAt: new Date('2024-01-02'),
      });

      vi.mocked(DomainEventModel.bulkCreate).mockResolvedValue([] as any);

      await repository.save([event1, event2], mockTransaction);

      expect(DomainEventModel.bulkCreate).toHaveBeenCalledWith(
        [event1.toJson(), event2.toJson()],
        { transaction: mockTransaction }
      );
    });

    it('should not save when events array is empty', async () => {
      await repository.save([], mockTransaction);

      expect(DomainEventModel.bulkCreate).not.toHaveBeenCalled();
    });

    it('should save single event', async () => {
      const aggregateId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const event = new DomainEvent({
        id: Uuid.create('550e8400-e29b-41d4-a716-446655440001'),
        aggregateId,
        aggregateName: 'User',
        eventType: UserEventType.REGISTERED,
        data: { email: 'test@example.com' },
        createdAt: new Date('2024-01-01'),
      });

      vi.mocked(DomainEventModel.bulkCreate).mockResolvedValue([] as any);

      await repository.save([event], mockTransaction);

      expect(DomainEventModel.bulkCreate).toHaveBeenCalledWith(
        [event.toJson()],
        { transaction: mockTransaction }
      );
    });
  });

  describe('findByAggregateId', () => {
    it('should find domain events by aggregate ID', async () => {
      const aggregateId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const eventId1 = '550e8400-e29b-41d4-a716-446655440001';
      const eventId2 = '550e8400-e29b-41d4-a716-446655440002';

      const mockModels = [
        {
          id: eventId1,
          aggregateId: aggregateId.getValue(),
          aggregateName: 'User',
          eventType: UserEventType.REGISTERED,
          data: { email: 'test@example.com' },
          metadata: null,
          createdAt: new Date('2024-01-01'),
          createdBy: null,
        },
        {
          id: eventId2,
          aggregateId: aggregateId.getValue(),
          aggregateName: 'User',
          eventType: UserEventType.REGISTERED,
          data: { email: 'test2@example.com' },
          metadata: { source: 'api' },
          createdAt: new Date('2024-01-02'),
          createdBy: '550e8400-e29b-41d4-a716-446655440999',
        },
      ] as unknown as DomainEventModel[];

      vi.mocked(DomainEventModel.findAll).mockResolvedValue(mockModels);

      const result = await repository.findByAggregateId(aggregateId);

      expect(DomainEventModel.findAll).toHaveBeenCalledWith({
        where: {
          aggregateId: aggregateId.getValue(),
        },
        order: [['createdAt', 'ASC']],
      });

      expect(result).toHaveLength(2);
      expect(result[0]!).toBeInstanceOf(DomainEvent);
      expect(result[0]!.id.getValue()).toBe(eventId1);
      expect(result[0]!.aggregateId.getValue()).toBe(aggregateId.getValue());
      expect(result[0]!.metadata).toBeUndefined();
      expect(result[0]!.createdBy).toBeUndefined();

      expect(result[1]!).toBeInstanceOf(DomainEvent);
      expect(result[1]!.id.getValue()).toBe(eventId2);
      expect(result[1]!.metadata).toEqual({ source: 'api' });
      expect(result[1]!.createdBy).toBeInstanceOf(Uuid);
      expect(result[1]!.createdBy?.getValue()).toBe(
        '550e8400-e29b-41d4-a716-446655440999'
      );
    });

    it('should return empty array when no events found', async () => {
      const aggregateId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');

      vi.mocked(DomainEventModel.findAll).mockResolvedValue([]);

      const result = await repository.findByAggregateId(aggregateId);

      expect(result).toEqual([]);
    });

    it('should handle events with null metadata', async () => {
      const aggregateId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const eventId = '550e8400-e29b-41d4-a716-446655440001';

      const mockModels = [
        {
          id: eventId,
          aggregateId: aggregateId.getValue(),
          aggregateName: 'User',
          eventType: UserEventType.REGISTERED,
          data: { email: 'test@example.com' },
          metadata: null,
          createdAt: new Date('2024-01-01'),
          createdBy: null,
        },
      ] as unknown as DomainEventModel[];

      vi.mocked(DomainEventModel.findAll).mockResolvedValue(mockModels);

      const result = await repository.findByAggregateId(aggregateId);

      expect(result[0]!.metadata).toBeUndefined();
    });

    it('should handle events with undefined metadata', async () => {
      const aggregateId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const eventId = '550e8400-e29b-41d4-a716-446655440001';

      const mockModels = [
        {
          id: eventId,
          aggregateId: aggregateId.getValue(),
          aggregateName: 'User',
          eventType: UserEventType.REGISTERED,
          data: { email: 'test@example.com' },
          metadata: undefined,
          createdAt: new Date('2024-01-01'),
          createdBy: null,
        },
      ] as unknown as DomainEventModel[];

      vi.mocked(DomainEventModel.findAll).mockResolvedValue(mockModels);

      const result = await repository.findByAggregateId(aggregateId);

      expect(result[0]!.metadata).toBeUndefined();
    });
  });
});
