import { Op, QueryTypes, type Sequelize, type Transaction } from 'sequelize';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import type { DomainEventRepository } from '@app/common/infrastructure/repositories/domain-event.repository';
import { ValidationException } from '@app/common/utils/exceptions';
import { UserGroup } from '@app/modules/auth/domain/aggregates/user-group';
import { UserGroupRoleModel } from '@app/modules/auth/infrastructure/models/user-group-role.model';
import { UserGroupUserModel } from '@app/modules/auth/infrastructure/models/user-group-user.model';
import { UserGroupModel } from '@app/modules/auth/infrastructure/models/user-group.model';
import { UserGroupRepositoryImpl } from '@app/modules/auth/infrastructure/repositories/user-group.repository-impl';

vi.mock('@app/modules/auth/infrastructure/models/user-group.model');
vi.mock('@app/modules/auth/infrastructure/models/user-group-user.model');
vi.mock('@app/modules/auth/infrastructure/models/user-group-role.model');
vi.mock('@app/common/utils/full-text-search', () => ({
  buildFullTextSearch: vi.fn(),
}));

describe('UserGroupRepositoryImpl', () => {
  let repository: UserGroupRepositoryImpl;
  let mockSequelize: Sequelize;
  let mockTransaction: Transaction;
  let mockDomainEventRepository: DomainEventRepository;

  const userGroupId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
  const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440001');
  const roleId = Uuid.create('550e8400-e29b-41d4-a716-446655440003');

  beforeEach(async () => {
    vi.clearAllMocks();

    const { buildFullTextSearch } = await import(
      '@app/common/utils/full-text-search'
    );
    vi.mocked(buildFullTextSearch).mockReturnValue({
      searchCondition: undefined,
      rankLiteral: undefined,
    });

    mockTransaction = {
      commit: vi.fn().mockResolvedValue(undefined),
      rollback: vi.fn().mockResolvedValue(undefined),
    } as unknown as Transaction;

    mockSequelize = {
      query: vi.fn(),
      transaction: vi.fn().mockResolvedValue(mockTransaction),
    } as unknown as Sequelize;

    mockDomainEventRepository = {
      save: vi.fn().mockResolvedValue([]),
    } as unknown as DomainEventRepository;

    (UserGroupModel as any).sequelize = mockSequelize;
    (UserGroupRoleModel as any).sequelize = mockSequelize;

    repository = new UserGroupRepositoryImpl(mockDomainEventRepository);
  });

  describe('getAggregateName', () => {
    it('should return "UserGroup" as aggregate name', () => {
      const aggregateName = (repository as any).getAggregateName();
      expect(aggregateName).toBe('UserGroup');
    });
  });

  describe('getModel', () => {
    it('should return UserGroupModel', () => {
      const model = (repository as any).getModel();
      expect(model).toBe(UserGroupModel);
    });
  });

  describe('toDomain', () => {
    it('should convert UserGroupModel to UserGroup domain aggregate', () => {
      const createdByUuid = Uuid.create('550e8400-e29b-41d4-a716-446655440123');
      const lastModifiedByUuid = Uuid.create(
        '550e8400-e29b-41d4-a716-446655440123'
      );
      const userGroupModel = {
        id: userGroupId.getValue(),
        name: 'Test Group',
        description: 'Test Description',
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: createdByUuid.getValue(),
        lastModifiedBy: lastModifiedByUuid.getValue(),
      } as unknown as UserGroupModel;

      const userGroup = (repository as any).toDomain(userGroupModel);

      expect(userGroup).toBeInstanceOf(UserGroup);
      expect(userGroup.id.getValue()).toBe(userGroupId.getValue());
      expect(userGroup.name).toBe('Test Group');
      expect(userGroup.description).toBe('Test Description');
      expect(userGroup.createdBy).toBeInstanceOf(Uuid);
      expect(userGroup.createdBy?.getValue()).toBe(createdByUuid.getValue());
      expect(userGroup.lastModifiedBy).toBeInstanceOf(Uuid);
      expect(userGroup.lastModifiedBy?.getValue()).toBe(
        lastModifiedByUuid.getValue()
      );
    });

    it('should handle user group without description (null)', () => {
      const userGroupModel = {
        id: userGroupId.getValue(),
        name: 'Test Group',
        description: null,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: null,
        lastModifiedBy: null,
      } as unknown as UserGroupModel;

      const userGroup = (repository as any).toDomain(userGroupModel);

      expect(userGroup.description).toBeUndefined();
    });

    it('should handle user group without description (undefined)', () => {
      const userGroupModel = {
        id: userGroupId.getValue(),
        name: 'Test Group',
        description: undefined,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: null,
        lastModifiedBy: null,
      } as unknown as UserGroupModel;

      const userGroup = (repository as any).toDomain(userGroupModel);

      expect(userGroup.description).toBeUndefined();
    });

    it('should handle user group with version null', () => {
      const userGroupModel = {
        id: userGroupId.getValue(),
        name: 'Test Group',
        description: 'Test Description',
        version: null,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: null,
        lastModifiedBy: null,
      } as unknown as UserGroupModel;

      const userGroup = (repository as any).toDomain(userGroupModel);

      expect(userGroup).toBeInstanceOf(UserGroup);
      expect(userGroup.version).toBe(0);
    });
  });

  describe('save - create new user group', () => {
    it('should create a new user group when version is 0', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'New Group',
        description: 'New Description',
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const mockCreate = vi
        .fn()
        .mockResolvedValue({ id: userGroupId.getValue() });
      (UserGroupModel as any).create = mockCreate;

      await repository.save(userGroup);

      expect(mockSequelize.transaction).toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalledWith(userGroup.toJson(), {
        transaction: mockTransaction,
      });
      expect(mockDomainEventRepository.save).not.toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should create user group without description', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'New Group',
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const mockCreate = vi
        .fn()
        .mockResolvedValue({ id: userGroupId.getValue() });
      (UserGroupModel as any).create = mockCreate;

      await repository.save(userGroup);

      expect(mockCreate).toHaveBeenCalledWith(userGroup.toJson(), {
        transaction: mockTransaction,
      });
    });

    it('should save domain events when aggregate has events', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'New Group',
        description: 'New Description',
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      userGroup.setName('Updated Name');

      const mockCreate = vi
        .fn()
        .mockResolvedValue({ id: userGroupId.getValue() });
      (UserGroupModel as any).create = mockCreate;

      await repository.save(userGroup);

      expect(mockCreate).toHaveBeenCalled();
      expect(mockDomainEventRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            eventType: expect.any(String),
          }),
        ]),
        mockTransaction
      );
      expect(userGroup.getEvents().length).toBeGreaterThan(0);
    });

    it('should execute postSaveCallback when provided', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'New Group',
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const mockCreate = vi
        .fn()
        .mockResolvedValue({ id: userGroupId.getValue() });
      (UserGroupModel as any).create = mockCreate;

      const postSaveCallback = vi.fn().mockResolvedValue(undefined);

      await repository.save(userGroup, postSaveCallback);

      expect(postSaveCallback).toHaveBeenCalledWith(mockTransaction);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should propagate error when domainEventRepository.save throws', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'New Group',
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      userGroup.setName('Updated Name');

      const mockCreate = vi
        .fn()
        .mockResolvedValue({ id: userGroupId.getValue() });
      (UserGroupModel as any).create = mockCreate;

      const error = new Error('Event save error');
      mockDomainEventRepository.save = vi.fn().mockRejectedValue(error);

      await expect(repository.save(userGroup)).rejects.toThrow(error);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('save - update existing user group', () => {
    it('should update an existing user group', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'Updated Group',
        description: 'Updated Description',
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
      });

      userGroup.prepareUpdate(
        Uuid.create('550e8400-e29b-41d4-a716-446655440999')
      );
      const mockUpdate = vi.fn().mockResolvedValue([1, []]);
      (UserGroupModel as any).update = mockUpdate;

      await repository.save(userGroup);

      expect(mockSequelize.transaction).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith(userGroup.toJson(), {
        where: {
          id: userGroupId.getValue(),
          version: 1,
        },
        transaction: mockTransaction,
      });
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should update user group with null lastModifiedBy', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'Updated Group',
        description: 'Updated Description',
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
        lastModifiedBy: null as any,
      });

      userGroup.prepareUpdate(
        Uuid.create('550e8400-e29b-41d4-a716-446655440999')
      );
      const mockUpdate = vi.fn().mockResolvedValue([1, []]);
      (UserGroupModel as any).update = mockUpdate;

      await repository.save(userGroup);

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should update user group with string lastModifiedBy', async () => {
      const lastModifiedBy = Uuid.create(
        '550e8400-e29b-41d4-a716-446655440456'
      );
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'Updated Group',
        description: 'Updated Description',
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
        lastModifiedBy,
      });

      userGroup.prepareUpdate(
        Uuid.create('550e8400-e29b-41d4-a716-446655440999')
      );
      const mockUpdate = vi.fn().mockResolvedValue([1, []]);
      (UserGroupModel as any).update = mockUpdate;

      await repository.save(userGroup);

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should throw ValidationException when version mismatch occurs', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'Updated Group',
        description: 'Updated Description',
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
      });

      userGroup.prepareUpdate(
        Uuid.create('550e8400-e29b-41d4-a716-446655440999')
      );
      const mockUpdate = vi.fn().mockResolvedValue([0, []]);
      const mockFindByPk = vi.fn().mockResolvedValue({ version: 2 });
      (UserGroupModel as any).update = mockUpdate;
      (UserGroupModel as any).findByPk = mockFindByPk;

      await expect(repository.save(userGroup)).rejects.toThrow(
        ValidationException
      );

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'Updated Group',
        description: 'Updated Description',
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
      });

      userGroup.prepareUpdate(
        Uuid.create('550e8400-e29b-41d4-a716-446655440999')
      );
      const error = new Error('Database error');
      const mockUpdate = vi.fn().mockRejectedValue(error);
      (UserGroupModel as any).update = mockUpdate;

      await expect(repository.save(userGroup)).rejects.toThrow(error);

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should save domain events when updating aggregate with events', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'Updated Group',
        description: 'Updated Description',
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
      });

      userGroup.prepareUpdate(
        Uuid.create('550e8400-e29b-41d4-a716-446655440999')
      );
      userGroup.setName('New Name');

      const mockUpdate = vi.fn().mockResolvedValue([1, []]);
      (UserGroupModel as any).update = mockUpdate;

      await repository.save(userGroup);

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockDomainEventRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            eventType: expect.any(String),
          }),
        ]),
        mockTransaction
      );
      expect(userGroup.getEvents().length).toBeGreaterThan(0);
    });

    it('should execute postSaveCallback when provided for update', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'Updated Group',
        description: 'Updated Description',
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
      });

      userGroup.prepareUpdate(
        Uuid.create('550e8400-e29b-41d4-a716-446655440999')
      );
      const mockUpdate = vi.fn().mockResolvedValue([1, []]);
      (UserGroupModel as any).update = mockUpdate;

      const postSaveCallback = vi.fn().mockResolvedValue(undefined);

      await repository.save(userGroup, postSaveCallback);

      expect(postSaveCallback).toHaveBeenCalledWith(mockTransaction);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete user group and commit transaction', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'Test Group',
        description: 'Test Description',
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      vi.mocked(UserGroupModel.destroy).mockResolvedValue(1);

      await repository.delete(userGroup);

      expect(mockSequelize.transaction).toHaveBeenCalled();
      expect(UserGroupModel.destroy).toHaveBeenCalledWith({
        where: { id: userGroupId.getValue() },
        transaction: mockTransaction,
      });
      expect(mockDomainEventRepository.save).not.toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should delete user group and save events in same transaction', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'Test Group',
        description: 'Test Description',
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      userGroup.markForDeletion();

      vi.mocked(UserGroupModel.destroy).mockResolvedValue(1);

      await repository.delete(userGroup);

      expect(UserGroupModel.destroy).toHaveBeenCalledWith({
        where: { id: userGroupId.getValue() },
        transaction: mockTransaction,
      });
      expect(mockDomainEventRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            eventType: 'USER_GROUP_DELETED',
          }),
        ]),
        mockTransaction
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should rollback transaction when destroy throws', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'Test Group',
        description: 'Test Description',
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      const error = new Error('Database error');
      vi.mocked(UserGroupModel.destroy).mockRejectedValue(error);

      await expect(repository.delete(userGroup)).rejects.toThrow(error);
      expect(UserGroupModel.destroy).toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });

    it('should rollback transaction when domain event save throws', async () => {
      const userGroup = new UserGroup({
        id: userGroupId,
        name: 'Test Group',
        description: 'Test Description',
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      userGroup.markForDeletion();

      vi.mocked(UserGroupModel.destroy).mockResolvedValue(1);
      const error = new Error('Event save error');
      mockDomainEventRepository.save = vi.fn().mockRejectedValue(error);

      await expect(repository.delete(userGroup)).rejects.toThrow(error);
      expect(UserGroupModel.destroy).toHaveBeenCalled();
      expect(mockDomainEventRepository.save).toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return user group when found', async () => {
      const mockUserGroupModel = {
        id: userGroupId.getValue(),
        name: 'Test Group',
        description: 'Test Description',
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: null,
        lastModifiedBy: null,
      } as unknown as UserGroupModel;

      vi.mocked(UserGroupModel.findByPk).mockResolvedValue(mockUserGroupModel);

      const result = await repository.findById(userGroupId);

      expect(UserGroupModel.findByPk).toHaveBeenCalledWith(
        userGroupId.getValue()
      );
      expect(result).toBeInstanceOf(UserGroup);
      expect(result?.id.getValue()).toBe(userGroupId.getValue());
      expect(result?.name).toBe('Test Group');
      expect(result?.description).toBe('Test Description');
      expect(result?.version).toBe(0);
    });

    it('should return user group with version 0 when version is null', async () => {
      const mockUserGroupModel = {
        id: userGroupId.getValue(),
        name: 'Test Group',
        description: 'Test Description',
        version: null,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: null,
        lastModifiedBy: null,
      } as unknown as UserGroupModel;

      vi.mocked(UserGroupModel.findByPk).mockResolvedValue(mockUserGroupModel);

      const result = await repository.findById(userGroupId);

      expect(result).toBeInstanceOf(UserGroup);
      expect(result?.version).toBe(0);
    });

    it('should return user group with createdBy and lastModifiedBy when provided', async () => {
      const createdByUuid = Uuid.create('550e8400-e29b-41d4-a716-446655440123');
      const lastModifiedByUuid = Uuid.create(
        '550e8400-e29b-41d4-a716-446655440124'
      );
      const mockUserGroupModel = {
        id: userGroupId.getValue(),
        name: 'Test Group',
        description: 'Test Description',
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
        createdBy: createdByUuid.getValue(),
        lastModifiedBy: lastModifiedByUuid.getValue(),
      } as unknown as UserGroupModel;

      vi.mocked(UserGroupModel.findByPk).mockResolvedValue(mockUserGroupModel);

      const result = await repository.findById(userGroupId);

      expect(result).toBeInstanceOf(UserGroup);
      expect(result?.createdBy?.getValue()).toBe(createdByUuid.getValue());
      expect(result?.lastModifiedBy?.getValue()).toBe(
        lastModifiedByUuid.getValue()
      );
    });

    it('should return undefined when user group not found (null)', async () => {
      vi.mocked(UserGroupModel.findByPk).mockResolvedValue(null);

      const result = await repository.findById(userGroupId);

      expect(result).toBeUndefined();
    });

    it('should return undefined when user group not found (undefined)', async () => {
      vi.mocked(UserGroupModel.findByPk).mockResolvedValue(undefined as any);

      const result = await repository.findById(userGroupId);

      expect(result).toBeUndefined();
    });

    it('should propagate error when findByPk throws', async () => {
      const error = new Error('Database error');
      vi.mocked(UserGroupModel.findByPk).mockRejectedValue(error);

      await expect(repository.findById(userGroupId)).rejects.toThrow(error);
    });
  });

  describe('userGroupExists', () => {
    it('should return true when user group exists', async () => {
      const mockUserGroupModel = {
        id: userGroupId.getValue(),
      } as unknown as UserGroupModel;

      vi.mocked(UserGroupModel.findByPk).mockResolvedValue(mockUserGroupModel);

      const result = await repository.userGroupExists(userGroupId);

      expect(UserGroupModel.findByPk).toHaveBeenCalledWith(
        userGroupId.getValue(),
        {
          attributes: ['id'],
        }
      );
      expect(result).toBe(true);
    });

    it('should return false when user group does not exist', async () => {
      vi.mocked(UserGroupModel.findByPk).mockResolvedValue(null);

      const result = await repository.userGroupExists(userGroupId);

      expect(result).toBe(false);
    });

    it('should propagate error when findByPk throws', async () => {
      const error = new Error('Database error');
      vi.mocked(UserGroupModel.findByPk).mockRejectedValue(error);

      await expect(repository.userGroupExists(userGroupId)).rejects.toThrow(
        error
      );
    });
  });

  describe('userInGroup', () => {
    it('should return true when user is in group', async () => {
      const mockAssociation = {
        userGroupId: userGroupId.getValue(),
        userId: userId.getValue(),
      } as unknown as UserGroupUserModel;

      vi.mocked(UserGroupUserModel.findOne).mockResolvedValue(mockAssociation);

      const result = await repository.userInGroup(userGroupId, userId);

      expect(UserGroupUserModel.findOne).toHaveBeenCalledWith({
        where: {
          userGroupId: userGroupId.getValue(),
          userId: userId.getValue(),
        },
      });
      expect(result).toBe(true);
    });

    it('should return false when user is not in group', async () => {
      vi.mocked(UserGroupUserModel.findOne).mockResolvedValue(null);

      const result = await repository.userInGroup(userGroupId, userId);

      expect(result).toBe(false);
    });

    it('should propagate error when findOne throws', async () => {
      const error = new Error('Database error');
      vi.mocked(UserGroupUserModel.findOne).mockRejectedValue(error);

      await expect(repository.userInGroup(userGroupId, userId)).rejects.toThrow(
        error
      );
    });
  });

  describe('addRole', () => {
    it('should add a role to a user group', async () => {
      vi.mocked(UserGroupRoleModel.create).mockResolvedValue(
        {} as UserGroupRoleModel
      );

      await repository.addRole(userGroupId, roleId);

      expect(UserGroupRoleModel.create).toHaveBeenCalledWith(
        {
          userGroupId: userGroupId.getValue(),
          roleId: roleId.getValue(),
          createdAt: expect.any(Date),
        },
        { transaction: undefined }
      );
    });

    it('should add a role to a user group with transaction', async () => {
      vi.mocked(UserGroupRoleModel.create).mockResolvedValue(
        {} as UserGroupRoleModel
      );

      await repository.addRole(userGroupId, roleId, mockTransaction);

      expect(UserGroupRoleModel.create).toHaveBeenCalledWith(
        {
          userGroupId: userGroupId.getValue(),
          roleId: roleId.getValue(),
          createdAt: expect.any(Date),
        },
        { transaction: mockTransaction }
      );
    });

    it('should propagate error when create throws', async () => {
      const error = new Error('Database error');
      vi.mocked(UserGroupRoleModel.create).mockRejectedValue(error);

      await expect(repository.addRole(userGroupId, roleId)).rejects.toThrow(
        error
      );
    });
  });

  describe('removeRole', () => {
    it('should remove a role from a user group', async () => {
      vi.mocked(UserGroupRoleModel.destroy).mockResolvedValue(1);

      await repository.removeRole(userGroupId, roleId);

      expect(UserGroupRoleModel.destroy).toHaveBeenCalledWith({
        where: {
          userGroupId: userGroupId.getValue(),
          roleId: roleId.getValue(),
        },
        transaction: undefined,
      });
    });

    it('should remove a role from a user group with transaction', async () => {
      vi.mocked(UserGroupRoleModel.destroy).mockResolvedValue(1);

      await repository.removeRole(userGroupId, roleId, mockTransaction);

      expect(UserGroupRoleModel.destroy).toHaveBeenCalledWith({
        where: {
          userGroupId: userGroupId.getValue(),
          roleId: roleId.getValue(),
        },
        transaction: mockTransaction,
      });
    });

    it('should propagate error when destroy throws', async () => {
      const error = new Error('Database error');
      vi.mocked(UserGroupRoleModel.destroy).mockRejectedValue(error);

      await expect(repository.removeRole(userGroupId, roleId)).rejects.toThrow(
        error
      );
    });
  });

  describe('roleInGroup', () => {
    it('should return true when role is in group', async () => {
      const mockAssociation = {
        userGroupId: userGroupId.getValue(),
        roleId: roleId.getValue(),
      } as unknown as UserGroupRoleModel;

      vi.mocked(UserGroupRoleModel.findOne).mockResolvedValue(mockAssociation);

      const result = await repository.roleInGroup(userGroupId, roleId);

      expect(UserGroupRoleModel.findOne).toHaveBeenCalledWith({
        where: {
          userGroupId: userGroupId.getValue(),
          roleId: roleId.getValue(),
        },
      });
      expect(result).toBe(true);
    });

    it('should return false when role is not in group', async () => {
      vi.mocked(UserGroupRoleModel.findOne).mockResolvedValue(null);

      const result = await repository.roleInGroup(userGroupId, roleId);

      expect(result).toBe(false);
    });

    it('should propagate error when findOne throws', async () => {
      const error = new Error('Database error');
      vi.mocked(UserGroupRoleModel.findOne).mockRejectedValue(error);

      await expect(repository.roleInGroup(userGroupId, roleId)).rejects.toThrow(
        error
      );
    });
  });

  describe('nameExists', () => {
    it('should return true when name exists', async () => {
      const mockUserGroupModel = {
        id: userGroupId.getValue(),
      } as unknown as UserGroupModel;

      vi.mocked(UserGroupModel.findOne).mockResolvedValue(mockUserGroupModel);

      const result = await repository.nameExists('Test Group');

      expect(UserGroupModel.findOne).toHaveBeenCalledWith({
        where: {
          name: 'Test Group',
        },
        attributes: ['id'],
      });
      expect(result).toBe(true);
    });

    it('should return false when name does not exist', async () => {
      vi.mocked(UserGroupModel.findOne).mockResolvedValue(null);

      const result = await repository.nameExists('Non-existent Group');

      expect(result).toBe(false);
    });

    it('should exclude user group ID when provided', async () => {
      const excludeId = Uuid.create('550e8400-e29b-41d4-a716-446655440999');
      vi.mocked(UserGroupModel.findOne).mockResolvedValue(null);

      await repository.nameExists('Test Group', excludeId);

      expect(UserGroupModel.findOne).toHaveBeenCalledWith({
        where: {
          name: 'Test Group',
          id: { [Op.ne]: excludeId.getValue() },
        },
        attributes: ['id'],
      });
    });

    it('should return false when name exists but matches excluded ID', async () => {
      const excludeId = Uuid.create('550e8400-e29b-41d4-a716-446655440999');
      vi.mocked(UserGroupModel.findOne).mockResolvedValue(null);

      const result = await repository.nameExists('Test Group', excludeId);

      expect(result).toBe(false);
    });

    it('should propagate error when findOne throws', async () => {
      const error = new Error('Database error');
      vi.mocked(UserGroupModel.findOne).mockRejectedValue(error);

      await expect(repository.nameExists('Test Group')).rejects.toThrow(error);
    });
  });

  describe('getUserRoleCodes', () => {
    it('should return user role codes from user groups', async () => {
      const mockResults = [
        { code: 'ADMIN' },
        { code: 'AUTH_MANAGER' },
      ] as Array<{ code: string }>;

      vi.mocked(mockSequelize.query).mockResolvedValue(mockResults as any);

      const result = await repository.getUserRoleCodes(userId);

      expect(mockSequelize.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT DISTINCT r.code'),
        {
          replacements: { userId: userId.getValue() },
          type: QueryTypes.SELECT,
        }
      );
      expect(result).toEqual(['ADMIN', 'AUTH_MANAGER']);
    });

    it('should return empty array when user has no roles', async () => {
      vi.mocked(mockSequelize.query).mockResolvedValue([] as any);

      const result = await repository.getUserRoleCodes(userId);

      expect(result).toEqual([]);
    });

    it('should throw error when Sequelize instance not found', async () => {
      (UserGroupRoleModel as any).sequelize = null;

      await expect(repository.getUserRoleCodes(userId)).rejects.toThrow(
        'Sequelize instance not found'
      );
    });

    it('should propagate error when query throws', async () => {
      (UserGroupRoleModel as any).sequelize = mockSequelize;
      const error = new Error('Database query error');
      vi.mocked(mockSequelize.query).mockRejectedValue(error);

      await expect(repository.getUserRoleCodes(userId)).rejects.toThrow(error);
    });
  });
});
