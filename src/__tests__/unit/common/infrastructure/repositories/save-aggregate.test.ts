import type { Model, ModelStatic, Sequelize, Transaction } from 'sequelize';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseAggregate } from '@app/common/domain/base-aggregate';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { ValidationErrorCode } from '@app/common/enums/validation-error-code';
import { saveAggregate } from '@app/common/infrastructure/repositories/save-aggregate';
import { ValidationException } from '@app/common/utils/exceptions';

class TestAggregate extends BaseAggregate {
  constructor(params: {
    id: Uuid;
    version?: number;
    createdAt: Date;
    lastModifiedAt: Date;
    createdBy?: Uuid;
  }) {
    super({
      id: params.id,
      version: params.version,
      createdAt: params.createdAt,
      lastModifiedAt: params.lastModifiedAt,
      createdBy: params.createdBy,
    });
  }

  public toJson(): Record<string, unknown> {
    return {
      id: this.id.getValue(),
      ...this.getBaseJson(),
    };
  }
}

describe('saveAggregate', () => {
  const operatorId = Uuid.create('550e8400-e29b-41d4-a716-446655440999');
  let mockModel: ModelStatic<Model>;
  let mockDatabase: Sequelize;
  let mockTransaction: Transaction;
  let mockCommit: ReturnType<typeof vi.fn>;
  let mockRollback: ReturnType<typeof vi.fn>;
  let mockUpdate: ReturnType<typeof vi.fn>;
  let mockFindByPk: ReturnType<typeof vi.fn>;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCommit = vi.fn().mockResolvedValue(undefined);
    mockRollback = vi.fn().mockResolvedValue(undefined);

    mockTransaction = {
      commit: mockCommit,
      rollback: mockRollback,
    } as unknown as Transaction;

    mockUpdate = vi.fn();
    mockFindByPk = vi.fn();
    mockCreate = vi.fn();

    mockDatabase = {
      transaction: vi.fn().mockResolvedValue(mockTransaction),
    } as unknown as Sequelize;

    mockModel = {
      create: mockCreate,
      update: mockUpdate,
      findByPk: mockFindByPk,
      sequelize: mockDatabase,
    } as unknown as ModelStatic<Model>;
  });

  describe('happy path', () => {
    it('should successfully save aggregate with Uuid ID', async () => {
      const uuid = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      mockUpdate.mockResolvedValue([1, []]);

      aggregate.prepareUpdate(operatorId);
      await saveAggregate({
        aggregate,
        model: mockModel,
      });

      expect(mockDatabase.transaction).toHaveBeenCalled();
      expect(aggregate.version).toBe(2);
      expect(mockUpdate).toHaveBeenCalledWith(aggregate.toJson(), {
        where: {
          id: uuid.getValue(),
          version: 1,
        },
        transaction: mockTransaction,
      });
      expect(mockCommit).toHaveBeenCalled();
      expect(mockRollback).not.toHaveBeenCalled();
      expect(mockFindByPk).not.toHaveBeenCalled();
    });

    it('should execute postSaveCallback when provided for existing aggregate', async () => {
      const uuid = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const postSaveCallback = vi.fn().mockResolvedValue(undefined);
      mockUpdate.mockResolvedValue([1, []]);

      aggregate.prepareUpdate(operatorId);
      await saveAggregate({
        aggregate,
        model: mockModel,
        postSaveCallback,
      });

      expect(postSaveCallback).toHaveBeenCalledWith(mockTransaction);
      expect(mockCommit).toHaveBeenCalled();
    });

    it('should execute postSaveCallback when provided for new aggregate', async () => {
      const uuid = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const postSaveCallback = vi.fn().mockResolvedValue(undefined);
      const mockCreatedModel = {
        id: uuid.getValue(),
        version: 0,
      } as unknown as Model;

      mockCreate.mockResolvedValue(mockCreatedModel);

      await saveAggregate({
        aggregate,
        model: mockModel,
        postSaveCallback,
      });

      expect(postSaveCallback).toHaveBeenCalledWith(mockTransaction);
      expect(mockCommit).toHaveBeenCalled();
    });

    it('should not execute postSaveCallback when not provided', async () => {
      const uuid = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      mockUpdate.mockResolvedValue([1, []]);

      aggregate.prepareUpdate(operatorId);
      await saveAggregate({
        aggregate,
        model: mockModel,
      });

      expect(mockCommit).toHaveBeenCalled();
      expect(mockFindByPk).not.toHaveBeenCalled();
    });

    it('should create new aggregate when version is 0', async () => {
      const uuid = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const mockCreatedModel = {
        id: uuid.getValue(),
        version: 0,
      } as unknown as Model;

      mockCreate.mockResolvedValue(mockCreatedModel);

      await saveAggregate({
        aggregate,
        model: mockModel,
      });

      expect(aggregate.version).toBe(0);
      expect(mockCreate).toHaveBeenCalledWith(aggregate.toJson(), {
        transaction: mockTransaction,
      });
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockDatabase.transaction).toHaveBeenCalled();
    });

    it('should create new aggregate with generated id when version is 0', async () => {
      const aggregate = new TestAggregate({
        id: Uuid.generate(),
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const generatedUuid = Uuid.create('650e8400-e29b-41d4-a716-446655440000');
      const mockCreatedModel = {
        id: generatedUuid.getValue(),
        version: 0,
      } as unknown as Model;

      mockCreate.mockResolvedValue(mockCreatedModel);

      await saveAggregate({
        aggregate,
        model: mockModel,
      });

      expect(aggregate.version).toBe(0);
      expect(mockCreate).toHaveBeenCalledWith(aggregate.toJson(), {
        transaction: mockTransaction,
      });
    });

    it('should create new aggregate with operatorId when version is 0', async () => {
      const operatorId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const uuid = Uuid.create('650e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: operatorId,
      });

      const mockCreatedModel = {
        id: uuid.getValue(),
        version: 0,
        createdBy: operatorId.getValue(),
      } as unknown as Model;

      mockCreate.mockResolvedValue(mockCreatedModel);

      await saveAggregate({
        aggregate,
        model: mockModel,
      });

      expect(aggregate.version).toBe(0);
      expect(aggregate.createdBy).toBe(operatorId);
      expect(mockCreate).toHaveBeenCalledWith(aggregate.toJson(), {
        transaction: mockTransaction,
      });
    });

    it('should throw error when creating new aggregate with existing ID', async () => {
      const uuid = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const duplicateError = new Error('Duplicate entry');
      mockCreate.mockRejectedValue(duplicateError);

      await expect(
        saveAggregate({
          aggregate,
          model: mockModel,
        })
      ).rejects.toThrow('Duplicate entry');

      expect(mockCreate).toHaveBeenCalledWith(aggregate.toJson(), {
        transaction: mockTransaction,
      });
      expect(mockRollback).toHaveBeenCalled();
      expect(mockCommit).not.toHaveBeenCalled();
    });

    it('should update aggregate with operatorId', async () => {
      const operatorId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const uuid = Uuid.create('650e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      mockUpdate.mockResolvedValue([1, []]);

      aggregate.prepareUpdate(operatorId);
      await saveAggregate({
        aggregate,
        model: mockModel,
      });

      expect(aggregate.version).toBe(2);
      expect(aggregate.lastModifiedBy).toBe(operatorId);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockCommit).toHaveBeenCalled();
      expect(mockFindByPk).not.toHaveBeenCalled();
    });

    it('should throw ValidationException when saving existing aggregate without prepareUpdate', async () => {
      const uuid = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      await expect(
        saveAggregate({
          aggregate,
          model: mockModel,
        })
      ).rejects.toThrow(ValidationException);

      await expect(
        saveAggregate({
          aggregate,
          model: mockModel,
        })
      ).rejects.toMatchObject({
        code: ValidationErrorCode.FIELD_IS_INVALID,
        data: {
          field: 'aggregate',
          message:
            'prepareUpdate must be called before saving an existing aggregate',
        },
      });

      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockRollback).toHaveBeenCalled();
      expect(mockCommit).not.toHaveBeenCalled();
    });
  });

  describe('version mismatch - affectedRows === 0', () => {
    it('should throw ValidationException when affectedRows is 0 and currentModel is null', async () => {
      const uuid = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      mockUpdate.mockResolvedValue([0, []]);
      mockFindByPk.mockResolvedValue(null);

      aggregate.prepareUpdate(operatorId);
      try {
        await saveAggregate({
          aggregate,
          model: mockModel,
        });
        expect.fail('Should have thrown ValidationException');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        const validationError = error as ValidationException;
        expect(validationError.code).toBe(ValidationErrorCode.OUTDATED_VERSION);
        expect(validationError.data).toEqual({
          id: uuid.getValue(),
          expectedVersion: 1,
          actualVersion: undefined,
        });
        expect(validationError.message).toBe(
          ValidationErrorCode.OUTDATED_VERSION
        );
      }

      expect(aggregate.version).toBe(2);
      expect(mockFindByPk).toHaveBeenCalledWith(uuid.getValue(), {
        transaction: mockTransaction,
        attributes: ['version'],
      });
      expect(mockRollback).toHaveBeenCalled();
      expect(mockCommit).not.toHaveBeenCalled();
    });

    it('should throw ValidationException when affectedRows is 0 and currentModel has no version', async () => {
      const uuid = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      mockUpdate.mockResolvedValue([0, []]);
      mockFindByPk.mockResolvedValue({} as unknown as Model);

      aggregate.prepareUpdate(operatorId);
      try {
        await saveAggregate({
          aggregate,
          model: mockModel,
        });
        expect.fail('Should have thrown ValidationException');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        const validationError = error as ValidationException;
        expect(validationError.code).toBe(ValidationErrorCode.OUTDATED_VERSION);
        expect(validationError.data).toEqual({
          id: uuid.getValue(),
          expectedVersion: 1,
          actualVersion: undefined,
        });
        expect(validationError.message).toBe(
          ValidationErrorCode.OUTDATED_VERSION
        );
      }

      expect(aggregate.version).toBe(2);
      expect(mockRollback).toHaveBeenCalled();
      expect(mockCommit).not.toHaveBeenCalled();
    });

    it('should throw ValidationException when affectedRows is 0 and currentModel has version', async () => {
      const uuid = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      mockUpdate.mockResolvedValue([0, []]);
      mockFindByPk.mockResolvedValue({ version: 5 } as unknown as Model);

      aggregate.prepareUpdate(operatorId);
      try {
        await saveAggregate({
          aggregate,
          model: mockModel,
        });
        expect.fail('Should have thrown ValidationException');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        const validationError = error as ValidationException;
        expect(validationError.code).toBe(ValidationErrorCode.OUTDATED_VERSION);
        expect(validationError.data).toEqual({
          id: uuid.getValue(),
          expectedVersion: 1,
          actualVersion: 5,
        });
        expect(validationError.message).toBe(
          ValidationErrorCode.OUTDATED_VERSION
        );
      }

      expect(aggregate.version).toBe(2);
      expect(mockRollback).toHaveBeenCalled();
      expect(mockCommit).not.toHaveBeenCalled();
    });

    it('should handle version mismatch when currentModel version is 0', async () => {
      const uuid = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      mockUpdate.mockResolvedValue([0, []]);
      mockFindByPk.mockResolvedValue({ version: 0 } as unknown as Model);

      aggregate.prepareUpdate(operatorId);
      try {
        await saveAggregate({
          aggregate,
          model: mockModel,
        });
        expect.fail('Should have thrown ValidationException');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        const validationError = error as ValidationException;
        expect(validationError.code).toBe(ValidationErrorCode.OUTDATED_VERSION);
        expect(validationError.data).toEqual({
          id: uuid.getValue(),
          expectedVersion: 1,
          actualVersion: 0,
        });
        expect(validationError.message).toBe(
          ValidationErrorCode.OUTDATED_VERSION
        );
      }

      expect(aggregate.version).toBe(2);
      expect(mockRollback).toHaveBeenCalled();
      expect(mockCommit).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw Error when Sequelize instance is missing', async () => {
      const uuid = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const modelWithoutSequelize = {
        create: mockCreate,
        update: mockUpdate,
        findByPk: mockFindByPk,
        sequelize: undefined,
      } as unknown as ModelStatic<Model>;

      await expect(
        saveAggregate({
          aggregate,
          model: modelWithoutSequelize,
        })
      ).rejects.toThrow('Missing Sequelize instance');
    });

    it('should rollback transaction when update throws error', async () => {
      const uuid = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const updateError = new Error('Database connection failed');
      mockUpdate.mockRejectedValue(updateError);

      aggregate.prepareUpdate(operatorId);
      await expect(
        saveAggregate({
          aggregate,
          model: mockModel,
        })
      ).rejects.toThrow('Database connection failed');

      expect(aggregate.version).toBe(2);
      expect(mockRollback).toHaveBeenCalled();
      expect(mockCommit).not.toHaveBeenCalled();
    });

    it('should rollback transaction when postSaveCallback throws error for existing aggregate', async () => {
      const uuid = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const callbackError = new Error('Callback failed');
      const postSaveCallback = vi.fn().mockRejectedValue(callbackError);

      mockUpdate.mockResolvedValue([1, []]);
      mockFindByPk.mockResolvedValue({
        id: uuid.getValue(),
        version: 2,
      } as unknown as Model);

      aggregate.prepareUpdate(operatorId);
      await expect(
        saveAggregate({
          aggregate,
          model: mockModel,
          postSaveCallback,
        })
      ).rejects.toThrow('Callback failed');

      expect(aggregate.version).toBe(2);
      expect(postSaveCallback).toHaveBeenCalled();
      expect(mockRollback).toHaveBeenCalled();
      expect(mockCommit).not.toHaveBeenCalled();
    });

    it('should rollback transaction when postSaveCallback throws error for new aggregate', async () => {
      const uuid = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const callbackError = new Error('Callback failed');
      const postSaveCallback = vi.fn().mockRejectedValue(callbackError);

      mockCreate.mockResolvedValue({
        id: uuid.getValue(),
        version: 0,
      } as unknown as Model);

      await expect(
        saveAggregate({
          aggregate,
          model: mockModel,
          postSaveCallback,
        })
      ).rejects.toThrow('Callback failed');

      expect(aggregate.version).toBe(0);
      expect(postSaveCallback).toHaveBeenCalled();
      expect(mockRollback).toHaveBeenCalled();
      expect(mockCommit).not.toHaveBeenCalled();
    });

    it('should rollback transaction when findByPk throws error during version mismatch', async () => {
      const uuid = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      mockUpdate.mockResolvedValue([0, []]);
      const findByPkError = new Error('Database query failed');
      mockFindByPk.mockRejectedValue(findByPkError);

      aggregate.prepareUpdate(operatorId);
      await expect(
        saveAggregate({
          aggregate,
          model: mockModel,
        })
      ).rejects.toThrow('Database query failed');

      expect(aggregate.version).toBe(2);
      expect(mockRollback).toHaveBeenCalled();
      expect(mockCommit).not.toHaveBeenCalled();
    });

    it('should rollback transaction when create throws error for new aggregate', async () => {
      const uuid = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const createError = new Error('Database create failed');
      mockCreate.mockRejectedValue(createError);

      await expect(
        saveAggregate({
          aggregate,
          model: mockModel,
        })
      ).rejects.toThrow('Database create failed');

      expect(aggregate.version).toBe(0);
      expect(mockRollback).toHaveBeenCalled();
      expect(mockCommit).not.toHaveBeenCalled();
    });

    it('should rollback transaction when commit throws error', async () => {
      const uuid = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      mockUpdate.mockResolvedValue([1, []]);
      const commitError = new Error('Commit failed');
      mockCommit.mockRejectedValue(commitError);

      aggregate.prepareUpdate(operatorId);
      await expect(
        saveAggregate({
          aggregate,
          model: mockModel,
        })
      ).rejects.toThrow('Commit failed');

      expect(aggregate.version).toBe(2);
      expect(mockRollback).toHaveBeenCalled();
      expect(mockFindByPk).not.toHaveBeenCalled();
    });

    it('should throw error when transaction creation fails', async () => {
      const uuid = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const transactionError = new Error('Transaction creation failed');
      vi.mocked(mockDatabase.transaction).mockRejectedValue(transactionError);

      aggregate.prepareUpdate(operatorId);
      await expect(
        saveAggregate({
          aggregate,
          model: mockModel,
        })
      ).rejects.toThrow('Transaction creation failed');

      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockCommit).not.toHaveBeenCalled();
      expect(mockRollback).not.toHaveBeenCalled();
    });

    it('should handle rollback failure gracefully', async () => {
      const uuid = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const updateError = new Error('Database connection failed');
      mockUpdate.mockRejectedValue(updateError);
      const rollbackError = new Error('Rollback failed');
      mockRollback.mockRejectedValue(rollbackError);

      aggregate.prepareUpdate(operatorId);
      await expect(
        saveAggregate({
          aggregate,
          model: mockModel,
        })
      ).rejects.toThrow('Rollback failed');

      expect(mockRollback).toHaveBeenCalled();
      expect(mockCommit).not.toHaveBeenCalled();
    });

    it('should handle rollback failure when create throws error', async () => {
      const uuid = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
      const aggregate = new TestAggregate({
        id: uuid,
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const createError = new Error('Database create failed');
      mockCreate.mockRejectedValue(createError);
      const rollbackError = new Error('Rollback failed');
      mockRollback.mockRejectedValue(rollbackError);

      await expect(
        saveAggregate({
          aggregate,
          model: mockModel,
        })
      ).rejects.toThrow('Rollback failed');

      expect(mockRollback).toHaveBeenCalled();
      expect(mockCommit).not.toHaveBeenCalled();
    });
  });
});
