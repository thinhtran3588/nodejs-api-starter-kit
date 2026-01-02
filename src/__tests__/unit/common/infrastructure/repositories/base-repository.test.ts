import type { Model, ModelStatic, Sequelize, Transaction } from 'sequelize';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseAggregate } from '@app/common/domain/base-aggregate';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import { BaseRepository } from '@app/common/infrastructure/repositories/base-repository';
import type { DomainEventRepository } from '@app/common/infrastructure/repositories/domain-event.repository';
import { ValidationException } from '@app/common/utils/exceptions';

class TestAggregate extends BaseAggregate {
  constructor(params: {
    id: Uuid;
    version?: number;
    createdAt: Date;
    lastModifiedAt: Date;
    createdBy?: Uuid;
    lastModifiedBy?: Uuid;
  }) {
    super({
      id: params.id,
      version: params.version,
      createdAt: params.createdAt,
      lastModifiedAt: params.lastModifiedAt,
      createdBy: params.createdBy,
      lastModifiedBy: params.lastModifiedBy,
    });
  }

  public toJson(): Record<string, unknown> {
    return {
      id: this.id.getValue(),
      ...this.getBaseJson(),
    };
  }

  public testRegisterEvent(
    eventType: string,
    data: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): void {
    this.registerEvent(eventType, data, metadata);
  }
}

class TestRepository extends BaseRepository<TestAggregate> {
  private testModel: ModelStatic<Model>;

  constructor(
    domainEventRepository: DomainEventRepository,
    model: ModelStatic<Model>
  ) {
    super(domainEventRepository);
    this.testModel = model;
  }

  protected getAggregateName(): string {
    return 'TestAggregate';
  }

  protected getModel(): ModelStatic<Model> {
    return this.testModel;
  }

  protected toDomain(model: Model): TestAggregate {
    return new TestAggregate({
      id: Uuid.create(model.get('id') as string),
      version: (model.get('version') as number) ?? 0,
      createdAt: model.get('createdAt') as Date,
      lastModifiedAt: model.get('lastModifiedAt') as Date,
      createdBy: model.get('createdBy')
        ? Uuid.create(model.get('createdBy') as string)
        : undefined,
      lastModifiedBy: model.get('lastModifiedBy')
        ? Uuid.create(model.get('lastModifiedBy') as string)
        : undefined,
    });
  }
}

describe('BaseRepository', () => {
  let repository: TestRepository;
  let mockDomainEventRepository: DomainEventRepository;
  let mockModel: ModelStatic<Model>;
  let mockSequelize: Sequelize;
  let mockTransaction: Transaction;
  let mockCreate: ReturnType<typeof vi.fn>;
  let mockUpdate: ReturnType<typeof vi.fn>;
  let mockFindByPk: ReturnType<typeof vi.fn>;
  let mockDestroy: ReturnType<typeof vi.fn>;
  let mockCommit: ReturnType<typeof vi.fn>;
  let mockRollback: ReturnType<typeof vi.fn>;

  const aggregateId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');

  beforeEach(() => {
    vi.clearAllMocks();

    mockCommit = vi.fn().mockResolvedValue(undefined);
    mockRollback = vi.fn().mockResolvedValue(undefined);

    mockTransaction = {
      commit: mockCommit,
      rollback: mockRollback,
    } as unknown as Transaction;

    mockSequelize = {
      transaction: vi.fn().mockResolvedValue(mockTransaction),
    } as unknown as Sequelize;

    mockCreate = vi.fn();
    mockUpdate = vi.fn();
    mockFindByPk = vi.fn();
    mockDestroy = vi.fn();

    mockModel = {
      create: mockCreate,
      update: mockUpdate,
      findByPk: mockFindByPk,
      destroy: mockDestroy,
      sequelize: mockSequelize,
    } as unknown as ModelStatic<Model>;

    mockDomainEventRepository = {
      save: vi.fn().mockResolvedValue([]),
    } as unknown as DomainEventRepository;

    repository = new TestRepository(mockDomainEventRepository, mockModel);
  });

  describe('save - create new aggregate', () => {
    it('should create a new aggregate when version is 0', async () => {
      const aggregate = new TestAggregate({
        id: aggregateId,
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      mockCreate.mockResolvedValue({ id: aggregateId.getValue() });

      await repository.save(aggregate);

      expect(mockSequelize.transaction).toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalledWith(aggregate.toJson(), {
        transaction: mockTransaction,
      });
      expect(mockDomainEventRepository.save).not.toHaveBeenCalled();
      expect(mockCommit).toHaveBeenCalled();
    });

    it('should save domain events when aggregate has events', async () => {
      const aggregate = new TestAggregate({
        id: aggregateId,
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      aggregate.testRegisterEvent('TEST_EVENT', { data: 'test' });

      mockCreate.mockResolvedValue({ id: aggregateId.getValue() });

      await repository.save(aggregate);

      expect(mockCreate).toHaveBeenCalled();
      expect(mockDomainEventRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            eventType: 'TEST_EVENT',
          }),
        ]),
        mockTransaction
      );
      expect(aggregate.getEvents().length).toBe(1);
    });

    it('should execute postSaveCallback when provided for create', async () => {
      const aggregate = new TestAggregate({
        id: aggregateId,
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      mockCreate.mockResolvedValue({ id: aggregateId.getValue() });
      const postSaveCallback = vi.fn().mockResolvedValue(undefined);

      await repository.save(aggregate, postSaveCallback);

      expect(postSaveCallback).toHaveBeenCalledWith(mockTransaction);
      expect(mockCommit).toHaveBeenCalled();
    });

    it('should throw error when Sequelize instance is missing', async () => {
      const aggregate = new TestAggregate({
        id: aggregateId,
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      (mockModel as any).sequelize = null;

      await expect(repository.save(aggregate)).rejects.toThrow(
        'Missing Sequelize instance'
      );
    });

    it('should rollback transaction when create throws', async () => {
      const aggregate = new TestAggregate({
        id: aggregateId,
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const error = new Error('Database error');
      mockCreate.mockRejectedValue(error);

      await expect(repository.save(aggregate)).rejects.toThrow(error);
      expect(mockRollback).toHaveBeenCalled();
    });

    it('should rollback transaction when domainEventRepository.save throws', async () => {
      const aggregate = new TestAggregate({
        id: aggregateId,
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      aggregate.testRegisterEvent('TEST_EVENT', { data: 'test' });
      mockCreate.mockResolvedValue({ id: aggregateId.getValue() });

      const error = new Error('Event save error');
      mockDomainEventRepository.save = vi.fn().mockRejectedValue(error);

      await expect(repository.save(aggregate)).rejects.toThrow(error);
      expect(mockRollback).toHaveBeenCalled();
    });

    it('should rollback transaction when postSaveCallback throws', async () => {
      const aggregate = new TestAggregate({
        id: aggregateId,
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      mockCreate.mockResolvedValue({ id: aggregateId.getValue() });
      const error = new Error('Callback error');
      const postSaveCallback = vi.fn().mockRejectedValue(error);

      await expect(
        repository.save(aggregate, postSaveCallback)
      ).rejects.toThrow(error);
      expect(mockRollback).toHaveBeenCalled();
    });
  });

  describe('save - update existing aggregate', () => {
    it('should update an existing aggregate', async () => {
      const aggregate = new TestAggregate({
        id: aggregateId,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
      });

      aggregate.prepareUpdate(
        Uuid.create('550e8400-e29b-41d4-a716-446655440999')
      );
      mockUpdate.mockResolvedValue([1, []]);

      await repository.save(aggregate);

      expect(mockSequelize.transaction).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith(aggregate.toJson(), {
        where: {
          id: aggregateId.getValue(),
          version: 1,
        },
        transaction: mockTransaction,
      });
      expect(mockCommit).toHaveBeenCalled();
    });

    it('should throw ValidationException when updatePrepared is false', async () => {
      const aggregate = new TestAggregate({
        id: aggregateId,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
      });

      await expect(repository.save(aggregate)).rejects.toThrow(
        ValidationException
      );
      expect(mockRollback).toHaveBeenCalled();
    });

    it('should throw ValidationException when version mismatch occurs', async () => {
      const aggregate = new TestAggregate({
        id: aggregateId,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
      });

      aggregate.prepareUpdate(
        Uuid.create('550e8400-e29b-41d4-a716-446655440999')
      );
      mockUpdate.mockResolvedValue([0, []]);
      mockFindByPk.mockResolvedValue({ version: 2 } as unknown as Model);

      await expect(repository.save(aggregate)).rejects.toThrow(
        ValidationException
      );
      await expect(repository.save(aggregate)).rejects.toThrow(
        ValidationErrorCode.OUTDATED_VERSION
      );
      expect(mockFindByPk).toHaveBeenCalledWith(aggregateId.getValue(), {
        transaction: mockTransaction,
        attributes: ['version'],
      });
      expect(mockRollback).toHaveBeenCalled();
    });

    it('should handle version mismatch when currentModel is null', async () => {
      const aggregate = new TestAggregate({
        id: aggregateId,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
      });

      aggregate.prepareUpdate(
        Uuid.create('550e8400-e29b-41d4-a716-446655440999')
      );
      mockUpdate.mockResolvedValue([0, []]);
      mockFindByPk.mockResolvedValue(null);

      await expect(repository.save(aggregate)).rejects.toThrow(
        ValidationException
      );
      expect(mockRollback).toHaveBeenCalled();
    });

    it('should handle version mismatch when currentModel version is undefined', async () => {
      const aggregate = new TestAggregate({
        id: aggregateId,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
      });

      aggregate.prepareUpdate(
        Uuid.create('550e8400-e29b-41d4-a716-446655440999')
      );
      mockUpdate.mockResolvedValue([0, []]);
      mockFindByPk.mockResolvedValue({} as Model);

      await expect(repository.save(aggregate)).rejects.toThrow(
        ValidationException
      );
      expect(mockRollback).toHaveBeenCalled();
    });

    it('should save domain events when updating aggregate with events', async () => {
      const aggregate = new TestAggregate({
        id: aggregateId,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
      });

      aggregate.prepareUpdate(
        Uuid.create('550e8400-e29b-41d4-a716-446655440999')
      );
      aggregate.testRegisterEvent('TEST_EVENT', { data: 'test' });
      mockUpdate.mockResolvedValue([1, []]);

      await repository.save(aggregate);

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockDomainEventRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            eventType: 'TEST_EVENT',
          }),
        ]),
        mockTransaction
      );
      expect(aggregate.getEvents().length).toBe(1);
    });

    it('should execute postSaveCallback when provided for update', async () => {
      const aggregate = new TestAggregate({
        id: aggregateId,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
      });

      aggregate.prepareUpdate(
        Uuid.create('550e8400-e29b-41d4-a716-446655440999')
      );
      mockUpdate.mockResolvedValue([1, []]);
      const postSaveCallback = vi.fn().mockResolvedValue(undefined);

      await repository.save(aggregate, postSaveCallback);

      expect(postSaveCallback).toHaveBeenCalledWith(mockTransaction);
      expect(mockCommit).toHaveBeenCalled();
    });

    it('should rollback transaction when update throws', async () => {
      const aggregate = new TestAggregate({
        id: aggregateId,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
      });

      aggregate.prepareUpdate(
        Uuid.create('550e8400-e29b-41d4-a716-446655440999')
      );
      const error = new Error('Database error');
      mockUpdate.mockRejectedValue(error);

      await expect(repository.save(aggregate)).rejects.toThrow(error);
      expect(mockRollback).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return aggregate when found', async () => {
      const mockModelInstance = {
        get: vi.fn((key: string) => {
          const data: Record<string, unknown> = {
            id: aggregateId.getValue(),
            version: 1,
            createdAt: new Date('2024-01-01'),
            lastModifiedAt: new Date('2024-01-01'),
            createdBy: null,
            lastModifiedBy: null,
          };
          return data[key];
        }),
      } as unknown as Model;

      mockFindByPk.mockResolvedValue(mockModelInstance);

      const result = await repository.findById(aggregateId);

      expect(mockFindByPk).toHaveBeenCalledWith(aggregateId.getValue());
      expect(result).toBeInstanceOf(TestAggregate);
      expect(result?.id.getValue()).toBe(aggregateId.getValue());
    });

    it('should return undefined when aggregate not found (null)', async () => {
      mockFindByPk.mockResolvedValue(null);

      const result = await repository.findById(aggregateId);

      expect(result).toBeUndefined();
    });

    it('should return undefined when aggregate not found (undefined)', async () => {
      mockFindByPk.mockResolvedValue(undefined as any);

      const result = await repository.findById(aggregateId);

      expect(result).toBeUndefined();
    });

    it('should propagate error when findByPk throws', async () => {
      const error = new Error('Database error');
      mockFindByPk.mockRejectedValue(error);

      await expect(repository.findById(aggregateId)).rejects.toThrow(error);
    });
  });

  describe('delete', () => {
    it('should delete aggregate and commit transaction', async () => {
      const aggregate = new TestAggregate({
        id: aggregateId,
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      mockDestroy.mockResolvedValue(1);

      await repository.delete(aggregate);

      expect(mockSequelize.transaction).toHaveBeenCalled();
      expect(mockDestroy).toHaveBeenCalledWith({
        where: { id: aggregateId.getValue() },
        transaction: mockTransaction,
      });
      expect(mockDomainEventRepository.save).not.toHaveBeenCalled();
      expect(mockCommit).toHaveBeenCalled();
    });

    it('should delete aggregate and save events in same transaction', async () => {
      const aggregate = new TestAggregate({
        id: aggregateId,
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      aggregate.testRegisterEvent('DELETE_EVENT', { data: 'test' });

      mockDestroy.mockResolvedValue(1);

      await repository.delete(aggregate);

      expect(mockDestroy).toHaveBeenCalledWith({
        where: { id: aggregateId.getValue() },
        transaction: mockTransaction,
      });
      expect(mockDomainEventRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            eventType: 'DELETE_EVENT',
          }),
        ]),
        mockTransaction
      );
      expect(mockCommit).toHaveBeenCalled();
    });

    it('should rollback transaction when destroy throws', async () => {
      const aggregate = new TestAggregate({
        id: aggregateId,
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const error = new Error('Database error');
      mockDestroy.mockRejectedValue(error);

      await expect(repository.delete(aggregate)).rejects.toThrow(error);
      expect(mockDestroy).toHaveBeenCalled();
      expect(mockRollback).toHaveBeenCalled();
      expect(mockCommit).not.toHaveBeenCalled();
    });

    it('should rollback transaction when domain event save throws', async () => {
      const aggregate = new TestAggregate({
        id: aggregateId,
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      aggregate.testRegisterEvent('DELETE_EVENT', { data: 'test' });

      mockDestroy.mockResolvedValue(1);
      const error = new Error('Event save error');
      mockDomainEventRepository.save = vi.fn().mockRejectedValue(error);

      await expect(repository.delete(aggregate)).rejects.toThrow(error);
      expect(mockDestroy).toHaveBeenCalled();
      expect(mockDomainEventRepository.save).toHaveBeenCalled();
      expect(mockRollback).toHaveBeenCalled();
      expect(mockCommit).not.toHaveBeenCalled();
    });

    it('should throw error when Sequelize instance is missing', async () => {
      const aggregate = new TestAggregate({
        id: aggregateId,
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      (mockModel as any).sequelize = null;

      await expect(repository.delete(aggregate)).rejects.toThrow(
        'Missing Sequelize instance'
      );
    });
  });
});
