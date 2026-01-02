import { Op, type Sequelize, type Transaction } from 'sequelize';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import type { DomainEventRepository } from '@app/common/infrastructure/repositories/domain-event.repository';
import { ValidationException } from '@app/common/utils/exceptions';
import { User } from '@app/modules/auth/domain/aggregates/user';
import { SignInType } from '@app/modules/auth/domain/enums/sign-in-type';
import { UserStatus } from '@app/modules/auth/domain/enums/user-status';
import type { ExternalAuthenticationService } from '@app/modules/auth/domain/interfaces/services/external-authentication.service';
import { Email } from '@app/modules/auth/domain/value-objects/email';
import { Username } from '@app/modules/auth/domain/value-objects/username';
import { UserGroupUserModel } from '@app/modules/auth/infrastructure/models/user-group-user.model';
import { UserPendingDeletionModel } from '@app/modules/auth/infrastructure/models/user-pending-deletion.model';
import { UserModel } from '@app/modules/auth/infrastructure/models/user.model';
import { UserRepositoryImpl } from '@app/modules/auth/infrastructure/repositories/user.repository-impl';

vi.mock('@app/modules/auth/infrastructure/models/user.model');
vi.mock('@app/modules/auth/infrastructure/models/user-pending-deletion.model');
vi.mock('@app/modules/auth/infrastructure/models/user-group-user.model');
vi.mock('@app/common/utils/full-text-search', () => ({
  buildFullTextSearch: vi.fn(),
}));

describe('UserRepositoryImpl', () => {
  let repository: UserRepositoryImpl;
  let mockExternalAuthService: ExternalAuthenticationService;
  let mockDomainEventRepository: DomainEventRepository;
  let mockSequelize: Sequelize;
  let mockTransaction: Transaction;
  let mockCreate: ReturnType<typeof vi.fn>;
  let mockUpdate: ReturnType<typeof vi.fn>;
  let mockFindByPk: ReturnType<typeof vi.fn>;

  const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
  const userEmail = Email.create('test@example.com');
  const username = Username.create('testuser123');
  const externalId = 'firebase-user-123';

  beforeEach(async () => {
    vi.clearAllMocks();

    const { buildFullTextSearch } = await import(
      '@app/common/utils/full-text-search'
    );
    vi.mocked(buildFullTextSearch).mockReturnValue({
      searchCondition: undefined,
      rankLiteral: undefined,
    });

    mockCreate = vi.fn();
    mockUpdate = vi.fn();
    mockFindByPk = vi.fn();

    mockTransaction = {
      commit: vi.fn().mockResolvedValue(undefined),
      rollback: vi.fn().mockResolvedValue(undefined),
    } as unknown as Transaction;

    mockSequelize = {
      transaction: vi.fn().mockResolvedValue(mockTransaction),
    } as unknown as Sequelize;

    (UserModel as any).create = mockCreate;
    (UserModel as any).update = mockUpdate;
    (UserModel as any).findByPk = mockFindByPk;
    (UserModel as any).sequelize = mockSequelize;

    mockExternalAuthService = {
      findUserByEmail: vi.fn(),
    } as unknown as ExternalAuthenticationService;

    mockDomainEventRepository = {
      save: vi.fn().mockResolvedValue([]),
    } as unknown as DomainEventRepository;

    repository = new UserRepositoryImpl(
      mockDomainEventRepository,
      mockExternalAuthService
    );
  });

  describe('getAggregateName', () => {
    it('should return "User" as aggregate name', () => {
      const aggregateName = (repository as any).getAggregateName();
      expect(aggregateName).toBe('User');
    });
  });

  describe('getModel', () => {
    it('should return UserModel', () => {
      const model = (repository as any).getModel();
      expect(model).toBe(UserModel);
    });
  });

  describe('toDomain', () => {
    it('should convert UserModel to User domain aggregate', () => {
      const userModel = {
        id: userId.getValue(),
        email: userEmail.getValue(),
        externalId,
        signInType: SignInType.EMAIL,
        username: username.getValue(),
        displayName: 'Test User',
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: null,
        lastModifiedBy: null,
      } as unknown as UserModel;

      const user = (repository as any).toDomain(userModel);

      expect(user).toBeInstanceOf(User);
      expect(user.id.getValue()).toBe(userId.getValue());
      expect(user.email.getValue()).toBe(userEmail.getValue());
      expect(user.username?.getValue()).toBe(username.getValue());
      expect(user.displayName).toBe('Test User');
      expect(user.status).toBe(UserStatus.ACTIVE);
    });

    it('should handle user without username', () => {
      const userModel = {
        id: userId.getValue(),
        email: userEmail.getValue(),
        externalId,
        signInType: SignInType.EMAIL,
        username: null,
        displayName: 'Test User',
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: null,
        lastModifiedBy: null,
      } as unknown as UserModel;

      const user = (repository as any).toDomain(userModel);

      expect(user).toBeInstanceOf(User);
      expect(user.username).toBeUndefined();
    });

    it('should throw ValidationException for invalid username in database', () => {
      const userModel = {
        id: userId.getValue(),
        email: userEmail.getValue(),
        externalId,
        signInType: SignInType.EMAIL,
        username: 'short', // Too short (min 8 chars) - will fail validation
        displayName: 'Test User',
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: null,
        lastModifiedBy: null,
      } as unknown as UserModel;

      expect(() => (repository as any).toDomain(userModel)).toThrow(
        ValidationException
      );
    });

    it('should handle user with null displayName', () => {
      const userModel = {
        id: userId.getValue(),
        email: userEmail.getValue(),
        externalId,
        signInType: SignInType.EMAIL,
        username: null,
        displayName: null,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: null,
        lastModifiedBy: null,
      } as unknown as UserModel;

      const user = (repository as any).toDomain(userModel);

      expect(user).toBeInstanceOf(User);
      expect(user.displayName).toBeUndefined();
    });

    it('should handle user with undefined displayName', () => {
      const userModel = {
        id: userId.getValue(),
        email: userEmail.getValue(),
        externalId,
        signInType: SignInType.EMAIL,
        username: null,
        displayName: undefined,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: null,
        lastModifiedBy: null,
      } as unknown as UserModel;

      const user = (repository as any).toDomain(userModel);

      expect(user).toBeInstanceOf(User);
      expect(user.displayName).toBeUndefined();
    });

    it('should handle user with null status', () => {
      const userModel = {
        id: userId.getValue(),
        email: userEmail.getValue(),
        externalId,
        signInType: SignInType.EMAIL,
        username: null,
        displayName: 'Test User',
        status: null,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: null,
        lastModifiedBy: null,
      } as unknown as UserModel;

      const user = (repository as any).toDomain(userModel);

      expect(user).toBeInstanceOf(User);
      expect(user.status).toBe(UserStatus.ACTIVE);
    });

    it('should handle user with undefined status', () => {
      const userModel = {
        id: userId.getValue(),
        email: userEmail.getValue(),
        externalId,
        signInType: SignInType.EMAIL,
        username: null,
        displayName: 'Test User',
        status: undefined,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: null,
        lastModifiedBy: null,
      } as unknown as UserModel;

      const user = (repository as any).toDomain(userModel);

      expect(user).toBeInstanceOf(User);
      expect(user.status).toBe(UserStatus.ACTIVE);
    });

    it('should handle user with username null and usernameResult undefined', () => {
      const userModel = {
        id: userId.getValue(),
        email: userEmail.getValue(),
        externalId,
        signInType: SignInType.EMAIL,
        username: null,
        displayName: 'Test User',
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: null,
        lastModifiedBy: null,
      } as unknown as UserModel;

      const user = (repository as any).toDomain(userModel);

      expect(user).toBeInstanceOf(User);
      expect(user.username).toBeUndefined();
    });

    it('should throw ValidationException for invalid email in database', () => {
      const userModel = {
        id: userId.getValue(),
        email: 'invalid-email',
        externalId,
        signInType: SignInType.EMAIL,
        username: null,
        displayName: 'Test User',
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: null,
        lastModifiedBy: null,
      } as unknown as UserModel;

      expect(() => (repository as any).toDomain(userModel)).toThrow(
        ValidationException
      );
    });

    it('should handle user with createdBy and lastModifiedBy set', () => {
      const createdByUuid = Uuid.create('550e8400-e29b-41d4-a716-446655440123');
      const lastModifiedByUuid = Uuid.create(
        '550e8400-e29b-41d4-a716-446655440124'
      );
      const userModel = {
        id: userId.getValue(),
        email: userEmail.getValue(),
        externalId,
        signInType: SignInType.EMAIL,
        username: username.getValue(),
        displayName: 'Test User',
        status: UserStatus.ACTIVE,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
        createdBy: createdByUuid.getValue(),
        lastModifiedBy: lastModifiedByUuid.getValue(),
      } as unknown as UserModel;

      const user = (repository as any).toDomain(userModel);

      expect(user).toBeInstanceOf(User);
      expect(user.createdBy?.getValue()).toBe(createdByUuid.getValue());
      expect(user.lastModifiedBy?.getValue()).toBe(
        lastModifiedByUuid.getValue()
      );
    });

    it('should handle user with version null', () => {
      const userModel = {
        id: userId.getValue(),
        email: userEmail.getValue(),
        externalId,
        signInType: SignInType.EMAIL,
        username: null,
        displayName: 'Test User',
        status: UserStatus.ACTIVE,
        version: null,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: null,
        lastModifiedBy: null,
      } as unknown as UserModel;

      const user = (repository as any).toDomain(userModel);

      expect(user).toBeInstanceOf(User);
      expect(user.version).toBe(0);
    });
  });

  describe('save - create new user', () => {
    it('should create a new user when user does not exist', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        username,
        displayName: 'Test User',
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      mockCreate.mockResolvedValue({ id: userId.getValue() } as any);

      await repository.save(user);

      expect(mockSequelize.transaction).toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalledWith(user.toJson(), {
        transaction: mockTransaction,
      });
      expect(mockDomainEventRepository.save).not.toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(UserPendingDeletionModel.findOrCreate).not.toHaveBeenCalled();
    });

    it('should call postSaveCallback when creating a new user', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        username,
        displayName: 'Test User',
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      mockCreate.mockResolvedValue({ id: userId.getValue() } as any);
      const postSaveCallback = vi.fn().mockResolvedValue(undefined);

      await repository.save(user, postSaveCallback);

      expect(mockCreate).toHaveBeenCalled();
      expect(postSaveCallback).toHaveBeenCalledWith(mockTransaction);
      expect(UserPendingDeletionModel.findOrCreate).not.toHaveBeenCalled();
    });
  });

  describe('save - update existing user', () => {
    it('should update an existing user', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        username,
        displayName: 'Updated Name',
        status: UserStatus.ACTIVE,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
      });

      user.prepareUpdate(Uuid.create('550e8400-e29b-41d4-a716-446655440999'));
      mockUpdate.mockResolvedValue([1, []]);

      await repository.save(user);

      expect(mockSequelize.transaction).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith(user.toJson(), {
        where: {
          id: userId.getValue(),
          version: 1,
        },
        transaction: mockTransaction,
      });
      expect(mockDomainEventRepository.save).not.toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(UserPendingDeletionModel.findOrCreate).not.toHaveBeenCalled();
    });

    it('should create UserPendingDeletion when user status is DELETED', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        username,
        displayName: 'Test User',
        status: UserStatus.DELETED,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
      });

      user.prepareUpdate(Uuid.create('550e8400-e29b-41d4-a716-446655440999'));
      mockUpdate.mockResolvedValue([1, []]);
      vi.mocked(UserPendingDeletionModel.findOrCreate).mockResolvedValue([
        {} as UserPendingDeletionModel,
        false,
      ]);

      await repository.save(user);

      expect(mockUpdate).toHaveBeenCalled();
      expect(UserPendingDeletionModel.findOrCreate).toHaveBeenCalledWith({
        where: { id: userId.getValue() },
        defaults: { id: userId.getValue() },
        transaction: mockTransaction,
      });
    });

    it('should update user and create UserPendingDeletion when status is DELETED', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        username,
        displayName: 'Test User',
        status: UserStatus.DELETED,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
      });

      user.prepareUpdate(Uuid.create('550e8400-e29b-41d4-a716-446655440999'));
      mockUpdate.mockResolvedValue([1, []]);
      vi.mocked(UserPendingDeletionModel.findOrCreate).mockResolvedValue([
        {} as UserPendingDeletionModel,
        false,
      ]);

      await repository.save(user);

      expect(mockUpdate).toHaveBeenCalled();
      expect(UserPendingDeletionModel.findOrCreate).toHaveBeenCalledWith({
        where: { id: userId.getValue() },
        defaults: { id: userId.getValue() },
        transaction: mockTransaction,
      });
    });

    it('should rollback transaction when creating UserPendingDeletion fails', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        username,
        displayName: 'Test User',
        status: UserStatus.DELETED,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
      });

      user.prepareUpdate(Uuid.create('550e8400-e29b-41d4-a716-446655440999'));
      mockUpdate.mockResolvedValue([1, []]);
      const error = new Error('Database error');
      vi.mocked(UserPendingDeletionModel.findOrCreate).mockRejectedValue(error);

      await expect(repository.save(user)).rejects.toThrow('Database error');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        username,
        displayName: 'Test User',
        status: UserStatus.ACTIVE,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      user.prepareUpdate(Uuid.create('550e8400-e29b-41d4-a716-446655440999'));
      const error = new Error('Database error');
      mockUpdate.mockRejectedValue(error);

      await expect(repository.save(user)).rejects.toThrow('Database error');
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(UserPendingDeletionModel.findOrCreate).not.toHaveBeenCalled();
    });

    it('should not create UserPendingDeletion when user status is not DELETED', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        username,
        displayName: 'Test User',
        status: UserStatus.DISABLED,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
      });

      user.prepareUpdate(Uuid.create('550e8400-e29b-41d4-a716-446655440999'));
      mockUpdate.mockResolvedValue([1, []]);

      await repository.save(user);

      expect(mockUpdate).toHaveBeenCalledWith(user.toJson(), {
        where: {
          id: userId.getValue(),
          version: 1,
        },
        transaction: mockTransaction,
      });
      expect(UserPendingDeletionModel.findOrCreate).not.toHaveBeenCalled();
    });

    it('should save user with update info already set', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        username,
        displayName: 'Test User',
        status: UserStatus.ACTIVE,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
      });

      const operatorId = Uuid.create('550e8400-e29b-41d4-a716-446655440999');
      user.prepareUpdate(operatorId);
      mockUpdate.mockResolvedValue([1, []]);

      await repository.save(user);

      expect(mockUpdate).toHaveBeenCalledWith(user.toJson(), {
        where: {
          id: userId.getValue(),
          version: 1,
        },
        transaction: mockTransaction,
      });
    });

    it('should call postSaveCallback when provided and status is not DELETED', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        username,
        displayName: 'Test User',
        status: UserStatus.ACTIVE,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
      });

      const operatorId = Uuid.create('550e8400-e29b-41d4-a716-446655440999');
      user.prepareUpdate(operatorId);
      mockUpdate.mockResolvedValue([1, []]);

      const postSaveCallback = vi.fn().mockResolvedValue(undefined);

      await repository.save(user, postSaveCallback);

      expect(mockUpdate).toHaveBeenCalled();
      expect(postSaveCallback).toHaveBeenCalledWith(mockTransaction);
      expect(UserPendingDeletionModel.findOrCreate).not.toHaveBeenCalled();
    });

    it('should call postSaveCallback when provided and status is DELETED', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        username,
        displayName: 'Test User',
        status: UserStatus.DELETED,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
      });

      const operatorId = Uuid.create('550e8400-e29b-41d4-a716-446655440999');
      user.prepareUpdate(operatorId);
      mockUpdate.mockResolvedValue([1, []]);
      vi.mocked(UserPendingDeletionModel.findOrCreate).mockResolvedValue([
        {} as UserPendingDeletionModel,
        false,
      ]);

      const postSaveCallback = vi.fn().mockResolvedValue(undefined);

      await repository.save(user, postSaveCallback);

      expect(mockUpdate).toHaveBeenCalled();
      expect(UserPendingDeletionModel.findOrCreate).toHaveBeenCalledWith({
        where: { id: userId.getValue() },
        defaults: { id: userId.getValue() },
        transaction: mockTransaction,
      });
      expect(postSaveCallback).toHaveBeenCalledWith(mockTransaction);
    });

    it('should handle postSaveCallback error and rollback transaction', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        username,
        displayName: 'Test User',
        status: UserStatus.ACTIVE,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-02'),
      });

      const operatorId = Uuid.create('550e8400-e29b-41d4-a716-446655440999');
      user.prepareUpdate(operatorId);
      mockUpdate.mockResolvedValue([1, []]);

      const callbackError = new Error('Callback error');
      const postSaveCallback = vi.fn().mockRejectedValue(callbackError);

      await expect(repository.save(user, postSaveCallback)).rejects.toThrow(
        'Callback error'
      );

      expect(mockUpdate).toHaveBeenCalled();
      expect(postSaveCallback).toHaveBeenCalledWith(mockTransaction);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUserModel = {
        id: userId.getValue(),
        email: userEmail.getValue(),
        externalId,
        signInType: SignInType.EMAIL,
        username: username.getValue(),
        displayName: 'Test User',
        status: UserStatus.ACTIVE,
        version: 0,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: null,
        lastModifiedBy: null,
      } as unknown as UserModel;

      vi.mocked(UserModel.findByPk).mockResolvedValue(mockUserModel);

      const result = await repository.findById(userId);

      expect(UserModel.findByPk).toHaveBeenCalledWith(userId.getValue());
      expect(result).toBeInstanceOf(User);
      expect(result?.id.getValue()).toBe(userId.getValue());
    });

    it('should return undefined when user not found', async () => {
      vi.mocked(UserModel.findByPk).mockResolvedValue(null);

      const result = await repository.findById(userId);

      expect(UserModel.findByPk).toHaveBeenCalledWith(userId.getValue());
      expect(result).toBeUndefined();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      const mockUserModel = {
        id: userId.getValue(),
        email: userEmail.getValue(),
        externalId,
        signInType: SignInType.EMAIL,
        username: username.getValue(),
        displayName: 'Test User',
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: null,
        lastModifiedBy: null,
      } as unknown as UserModel;

      vi.mocked(UserModel.findOne).mockResolvedValue(mockUserModel);

      const result = await repository.findByEmail(userEmail);

      expect(UserModel.findOne).toHaveBeenCalledWith({
        where: {
          email: userEmail.getValue(),
        },
      });
      expect(result).toBeInstanceOf(User);
      expect(result?.email.getValue()).toBe(userEmail.getValue());
    });

    it('should return undefined when user not found by email', async () => {
      vi.mocked(UserModel.findOne).mockResolvedValue(null);

      const result = await repository.findByEmail(userEmail);

      expect(result).toBeUndefined();
    });
  });

  describe('findByExternalId', () => {
    it('should return user when found by external ID', async () => {
      const mockUserModel = {
        id: userId.getValue(),
        email: userEmail.getValue(),
        externalId,
        signInType: SignInType.EMAIL,
        username: username.getValue(),
        displayName: 'Test User',
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: null,
        lastModifiedBy: null,
      } as unknown as UserModel;

      vi.mocked(UserModel.findOne).mockResolvedValue(mockUserModel);

      const result = await repository.findByExternalId(externalId);

      expect(UserModel.findOne).toHaveBeenCalledWith({
        where: {
          externalId,
        },
      });
      expect(result).toBeInstanceOf(User);
      expect(result?.externalId).toBe(externalId);
    });

    it('should return undefined when user not found by external ID', async () => {
      vi.mocked(UserModel.findOne).mockResolvedValue(null);

      const result = await repository.findByExternalId(externalId);

      expect(result).toBeUndefined();
    });
  });

  describe('findByUsername', () => {
    it('should return user when found by username', async () => {
      const mockUserModel = {
        id: userId.getValue(),
        email: userEmail.getValue(),
        externalId,
        signInType: SignInType.EMAIL,
        username: username.getValue(),
        displayName: 'Test User',
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: null,
        lastModifiedBy: null,
      } as unknown as UserModel;

      vi.mocked(UserModel.findOne).mockResolvedValue(mockUserModel);

      const result = await repository.findByUsername(username);

      expect(UserModel.findOne).toHaveBeenCalledWith({
        where: {
          username: username.getValue(),
        },
      });
      expect(result).toBeInstanceOf(User);
      expect(result?.username?.getValue()).toBe(username.getValue());
    });

    it('should return undefined when user not found by username', async () => {
      vi.mocked(UserModel.findOne).mockResolvedValue(null);

      const result = await repository.findByUsername(username);

      expect(result).toBeUndefined();
    });
  });

  describe('emailExists', () => {
    it('should return true when email exists in database', async () => {
      const mockUserModel = {
        id: userId.getValue(),
      } as unknown as UserModel;

      vi.mocked(UserModel.findOne).mockResolvedValue(mockUserModel);

      const result = await repository.emailExists(userEmail);

      expect(UserModel.findOne).toHaveBeenCalledWith({
        where: {
          email: userEmail.getValue(),
        },
        attributes: ['id'],
      });
      expect(result).toBe(true);
      expect(mockExternalAuthService.findUserByEmail).not.toHaveBeenCalled();
    });

    it('should check Firebase when email not found in database', async () => {
      vi.mocked(UserModel.findOne).mockResolvedValue(null);
      vi.mocked(mockExternalAuthService.findUserByEmail).mockResolvedValue({
        uid: externalId,
      } as any);

      const result = await repository.emailExists(userEmail);

      expect(mockExternalAuthService.findUserByEmail).toHaveBeenCalledWith(
        userEmail.getValue()
      );
      expect(result).toBe(true);
    });

    it('should return false when email not found in database or Firebase', async () => {
      vi.mocked(UserModel.findOne).mockResolvedValue(null);
      vi.mocked(mockExternalAuthService.findUserByEmail).mockResolvedValue(
        undefined
      );

      const result = await repository.emailExists(userEmail);

      expect(result).toBe(false);
    });
  });

  describe('usernameExists', () => {
    it('should return true when username exists', async () => {
      const mockUserModel = {
        id: userId.getValue(),
      } as unknown as UserModel;

      vi.mocked(UserModel.findOne).mockResolvedValue(mockUserModel);

      const result = await repository.usernameExists(username);

      expect(UserModel.findOne).toHaveBeenCalledWith({
        where: {
          username: username.getValue(),
        },
        attributes: ['id'],
      });
      expect(result).toBe(true);
    });

    it('should return false when username does not exist', async () => {
      vi.mocked(UserModel.findOne).mockResolvedValue(null);

      const result = await repository.usernameExists(username);

      expect(result).toBe(false);
    });

    it('should exclude user ID when excludeUserId is provided', async () => {
      const excludeUserId = Uuid.create('550e8400-e29b-41d4-a716-446655440001');
      vi.mocked(UserModel.findOne).mockResolvedValue(null);

      await repository.usernameExists(username, excludeUserId);

      expect(UserModel.findOne).toHaveBeenCalledWith({
        where: {
          username: username.getValue(),
          id: { [Op.ne]: excludeUserId.getValue() },
        },
        attributes: ['id'],
      });
    });
  });

  describe('addToGroup', () => {
    const userGroupId = Uuid.create('660e8400-e29b-41d4-a716-446655440000');

    it('should add a user to a user group', async () => {
      vi.mocked(UserGroupUserModel.create).mockResolvedValue(
        {} as UserGroupUserModel
      );

      await repository.addToGroup(userId, userGroupId);

      expect(UserGroupUserModel.create).toHaveBeenCalledWith(
        {
          userGroupId: userGroupId.getValue(),
          userId: userId.getValue(),
          createdAt: expect.any(Date),
        },
        { transaction: undefined }
      );
    });

    it('should add a user to a user group with transaction', async () => {
      vi.mocked(UserGroupUserModel.create).mockResolvedValue(
        {} as UserGroupUserModel
      );

      await repository.addToGroup(userId, userGroupId, mockTransaction);

      expect(UserGroupUserModel.create).toHaveBeenCalledWith(
        {
          userGroupId: userGroupId.getValue(),
          userId: userId.getValue(),
          createdAt: expect.any(Date),
        },
        { transaction: mockTransaction }
      );
    });

    it('should propagate error when create throws', async () => {
      const error = new Error('Database error');
      vi.mocked(UserGroupUserModel.create).mockRejectedValue(error);

      await expect(repository.addToGroup(userId, userGroupId)).rejects.toThrow(
        error
      );
    });
  });

  describe('removeFromGroup', () => {
    const userGroupId = Uuid.create('660e8400-e29b-41d4-a716-446655440000');

    it('should remove a user from a user group', async () => {
      vi.mocked(UserGroupUserModel.destroy).mockResolvedValue(1);

      await repository.removeFromGroup(userId, userGroupId);

      expect(UserGroupUserModel.destroy).toHaveBeenCalledWith({
        where: {
          userGroupId: userGroupId.getValue(),
          userId: userId.getValue(),
        },
        transaction: undefined,
      });
    });

    it('should remove a user from a user group with transaction', async () => {
      vi.mocked(UserGroupUserModel.destroy).mockResolvedValue(1);

      await repository.removeFromGroup(userId, userGroupId, mockTransaction);

      expect(UserGroupUserModel.destroy).toHaveBeenCalledWith({
        where: {
          userGroupId: userGroupId.getValue(),
          userId: userId.getValue(),
        },
        transaction: mockTransaction,
      });
    });

    it('should propagate error when destroy throws', async () => {
      const error = new Error('Database error');
      vi.mocked(UserGroupUserModel.destroy).mockRejectedValue(error);

      await expect(
        repository.removeFromGroup(userId, userGroupId)
      ).rejects.toThrow(error);
    });
  });

  describe('delete', () => {
    it('should throw error when delete is called', async () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      await expect(repository.delete(user)).rejects.toThrow(
        'delete() is not supported for UserRepository. Use markForDeletion() on the aggregate instead.'
      );
    });
  });
});
