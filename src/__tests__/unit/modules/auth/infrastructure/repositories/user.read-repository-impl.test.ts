import { DataTypes, literal, Op, Sequelize } from 'sequelize';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PAGINATION_DEFAULT_ITEMS_PER_PAGE } from '@app/common/constants';
import { buildFullTextSearch } from '@app/common/utils/full-text-search';
import { pickFields } from '@app/common/utils/pick-fields';
import type { UserReadModel } from '@app/modules/auth/application/interfaces/queries/user.read-model';
import { SignInType } from '@app/modules/auth/domain/enums/sign-in-type';
import { UserStatus } from '@app/modules/auth/domain/enums/user-status';
import { UserModel } from '@app/modules/auth/infrastructure/models/user.model';
import { UserReadRepositoryImpl } from '@app/modules/auth/infrastructure/repositories/user.read-repository-impl';

vi.mock('@app/modules/auth/infrastructure/models/user.model');
vi.mock('@app/common/utils/full-text-search');
vi.mock('@app/common/utils/pick-fields');

describe('UserReadRepositoryImpl', () => {
  let repository: UserReadRepositoryImpl;
  let mockReadDatabase: Sequelize;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReadDatabase = new Sequelize({
      dialect: 'postgres',
      logging: false,
    });
    // Initialize UserModel with read database for testing
    UserModel.init(
      {
        id: { type: DataTypes.UUID, primaryKey: true },
        email: { type: DataTypes.STRING },
        externalId: { type: DataTypes.STRING },
        signInType: { type: DataTypes.STRING },
        displayName: { type: DataTypes.STRING },
        username: { type: DataTypes.STRING },
        status: { type: DataTypes.STRING },
        version: { type: DataTypes.INTEGER },
        createdAt: { type: DataTypes.DATE },
        createdBy: { type: DataTypes.UUID },
        lastModifiedAt: { type: DataTypes.DATE },
        lastModifiedBy: { type: DataTypes.STRING },
      },
      { sequelize: mockReadDatabase, modelName: 'User', tableName: 'users' }
    );
    // Ensure model is registered on Sequelize instance
    if (!mockReadDatabase.models['User']) {
      mockReadDatabase.models['User'] = UserModel;
    }
    repository = new UserReadRepositoryImpl(mockReadDatabase);
  });

  describe('find - happy path', () => {
    it('should return paginated users without search term', async () => {
      const mockUsers: UserReadModel[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          signInType: SignInType.EMAIL,
          externalId: 'firebase-user-1',
          displayName: 'User One',
          username: 'user1',
          status: UserStatus.ACTIVE,
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          signInType: SignInType.EMAIL,
          externalId: 'firebase-user-2',
          displayName: 'User Two',
          username: 'user2',
          status: UserStatus.ACTIVE,
          version: 1,
          createdAt: new Date('2024-01-02'),
          lastModifiedAt: new Date('2024-01-02'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserModel.findAndCountAll).mockResolvedValue({
        count: 2 as unknown as any,
        rows: mockUsers as unknown as UserModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as UserReadModel);

      const result = await repository.find({});

      expect(buildFullTextSearch).toHaveBeenCalledWith(undefined);
      expect(UserModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['email', 'ASC']],
        attributes: undefined,
        replacements: undefined,
      });
      expect(result.data).toHaveLength(2);
      expect(result.pagination.count).toBe(2);
      expect(result.pagination.pageIndex).toBe(0);
    });

    it('should return paginated users with search term', async () => {
      const mockSearchCondition = literal('search condition');
      const mockUsers: UserReadModel[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          signInType: SignInType.EMAIL,
          externalId: 'firebase-user-1',
          displayName: 'User One',
          username: 'user1',
          status: UserStatus.ACTIVE,
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: mockSearchCondition,
        rankLiteral: undefined,
      });

      vi.mocked(UserModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUsers as unknown as UserModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as UserReadModel);

      const result = await repository.find({ searchTerm: 'user1' });

      expect(buildFullTextSearch).toHaveBeenCalledWith('user1');
      expect(UserModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          [Op.and]: [mockSearchCondition],
        },
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['email', 'ASC']],
        attributes: undefined,
        replacements: undefined,
      });
      expect(result.data).toHaveLength(1);
      expect(result.pagination.count).toBe(1);
    });

    it('should handle pagination parameters', async () => {
      const pageIndex = 2;
      const itemsPerPage = 10;

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserModel.findAndCountAll).mockResolvedValue({
        count: 25 as unknown as any,
        rows: [],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as UserReadModel);

      const result = await repository.find({
        pageIndex,
        itemsPerPage,
      });

      expect(UserModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: itemsPerPage,
        offset: pageIndex * itemsPerPage,
        order: [['email', 'ASC']],
        attributes: undefined,
        replacements: undefined,
      });
      expect(result.pagination.pageIndex).toBe(pageIndex);
      expect(result.pagination.count).toBe(25);
    });

    it('should handle field selection with id in fields', async () => {
      const fields: string[] = ['id', 'email'];
      const mockUsers: UserReadModel[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
        } as UserReadModel,
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUsers as unknown as UserModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as UserReadModel);

      const result = await repository.find({ fields });

      expect(UserModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['email', 'ASC']],
        attributes: expect.arrayContaining(['id', 'email']),
      });
      expect(pickFields).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
    });

    it('should handle field selection without id in fields', async () => {
      const fields: string[] = ['email', 'displayName'];
      const mockUsers: UserReadModel[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          displayName: 'User One',
        } as UserReadModel,
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUsers as unknown as UserModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as UserReadModel);

      const result = await repository.find({ fields });

      expect(UserModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['email', 'ASC']],
        attributes: expect.arrayContaining(['id', 'email', 'displayName']),
      });
      expect(pickFields).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
    });

    it('should filter users by userGroupId', async () => {
      const userGroupId = '550e8400-e29b-41d4-a716-446655440002';
      const mockUsers: UserReadModel[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          signInType: SignInType.EMAIL,
          externalId: 'firebase-user-1',
          displayName: 'User One',
          username: 'user1',
          status: UserStatus.ACTIVE,
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUsers as unknown as UserModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as UserReadModel);

      const result = await repository.find({ userGroupId });

      expect(buildFullTextSearch).toHaveBeenCalledWith(undefined);
      expect(UserModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          [Op.and]: [
            literal(
              `EXISTS (SELECT 1 FROM user_group_users WHERE user_group_users.user_id = "User".id AND user_group_users.user_group_id = :userGroupId)`
            ),
          ],
        },
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['email', 'ASC']],
        attributes: undefined,
        replacements: { userGroupId },
      });
      expect(result.data).toHaveLength(1);
      expect(result.pagination.count).toBe(1);
    });

    it('should combine search term and userGroupId filter', async () => {
      const userGroupId = '550e8400-e29b-41d4-a716-446655440002';
      const mockSearchCondition = literal('search condition');
      const mockUsers: UserReadModel[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          signInType: SignInType.EMAIL,
          externalId: 'firebase-user-1',
          displayName: 'User One',
          username: 'user1',
          status: UserStatus.ACTIVE,
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: mockSearchCondition,
        rankLiteral: undefined,
      });

      vi.mocked(UserModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUsers as unknown as UserModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as UserReadModel);

      const result = await repository.find({
        searchTerm: 'user1',
        userGroupId,
      });

      expect(buildFullTextSearch).toHaveBeenCalledWith('user1');
      expect(UserModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          [Op.and]: [
            mockSearchCondition,
            literal(
              `EXISTS (SELECT 1 FROM user_group_users WHERE user_group_users.user_id = "User".id AND user_group_users.user_group_id = :userGroupId)`
            ),
          ],
        },
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['email', 'ASC']],
        attributes: undefined,
        replacements: { userGroupId },
      });
      expect(result.data).toHaveLength(1);
      expect(result.pagination.count).toBe(1);
    });

    it('should use provided sortField and sortOrder', async () => {
      const mockUsers: UserReadModel[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          signInType: SignInType.EMAIL,
          externalId: 'firebase-user-1',
          displayName: 'User One',
          username: 'user1',
          status: UserStatus.ACTIVE,
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUsers as unknown as UserModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as UserReadModel);

      const result = await repository.find({
        sortField: 'username',
        sortOrder: 'DESC',
      });

      expect(UserModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['username', 'DESC']],
        attributes: undefined,
        replacements: undefined,
      });
      expect(result.data).toEqual(mockUsers);
    });

    it('should use createdAt as sortField with ASC order', async () => {
      const mockUsers: UserReadModel[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          signInType: SignInType.EMAIL,
          externalId: 'firebase-user-1',
          displayName: 'User One',
          username: 'user1',
          status: UserStatus.ACTIVE,
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUsers as unknown as UserModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as UserReadModel);

      const result = await repository.find({
        sortField: 'createdAt',
        sortOrder: 'ASC',
      });

      expect(UserModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['createdAt', 'ASC']],
        attributes: undefined,
        replacements: undefined,
      });
      expect(result.data).toEqual(mockUsers);
    });

    it('should use lastModifiedAt as sortField with DESC order', async () => {
      const mockUsers: UserReadModel[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          signInType: SignInType.EMAIL,
          externalId: 'firebase-user-1',
          displayName: 'User One',
          username: 'user1',
          status: UserStatus.ACTIVE,
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-02'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUsers as unknown as UserModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as UserReadModel);

      const result = await repository.find({
        sortField: 'lastModifiedAt',
        sortOrder: 'DESC',
      });

      expect(UserModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['lastModifiedAt', 'DESC']],
        attributes: undefined,
        replacements: undefined,
      });
      expect(result.data).toEqual(mockUsers);
    });

    it('should use email as sortField with ASC order', async () => {
      const mockUsers: UserReadModel[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          signInType: SignInType.EMAIL,
          externalId: 'firebase-user-1',
          displayName: 'User One',
          username: 'user1',
          status: UserStatus.ACTIVE,
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUsers as unknown as UserModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as UserReadModel);

      const result = await repository.find({
        sortField: 'email',
        sortOrder: 'ASC',
      });

      expect(UserModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['email', 'ASC']],
        attributes: undefined,
        replacements: undefined,
      });
      expect(result.data).toEqual(mockUsers);
    });

    it('should default to ASC when sortField is provided but sortOrder is not', async () => {
      const mockUsers: UserReadModel[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          signInType: SignInType.EMAIL,
          externalId: 'firebase-user-1',
          displayName: 'User One',
          username: 'user1',
          status: UserStatus.ACTIVE,
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUsers as unknown as UserModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as UserReadModel);

      const result = await repository.find({
        sortField: 'email',
      });

      expect(UserModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['email', 'ASC']],
        attributes: undefined,
        replacements: undefined,
      });
      expect(result.data).toEqual(mockUsers);
    });

    it('should use default email and ASC when sortField and sortOrder are explicitly undefined', async () => {
      const mockUsers: UserReadModel[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          signInType: SignInType.EMAIL,
          externalId: 'firebase-user-1',
          displayName: 'User One',
          username: 'user1',
          status: UserStatus.ACTIVE,
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUsers as unknown as UserModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as UserReadModel);

      const result = await repository.find({
        sortField: undefined,
        sortOrder: undefined,
      });

      expect(UserModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['email', 'ASC']],
        attributes: undefined,
        replacements: undefined,
      });
      expect(result.data).toEqual(mockUsers);
    });

    it('should use default email when sortField is undefined but sortOrder is provided', async () => {
      const mockUsers: UserReadModel[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          signInType: SignInType.EMAIL,
          externalId: 'firebase-user-1',
          displayName: 'User One',
          username: 'user1',
          status: UserStatus.ACTIVE,
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUsers as unknown as UserModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as UserReadModel);

      const result = await repository.find({
        sortField: undefined,
        sortOrder: 'DESC',
      });

      expect(UserModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['email', 'DESC']],
        attributes: undefined,
        replacements: undefined,
      });
      expect(result.data).toEqual(mockUsers);
    });

    it('should use default ASC when sortField is provided but sortOrder is undefined', async () => {
      const mockUsers: UserReadModel[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          signInType: SignInType.EMAIL,
          externalId: 'firebase-user-1',
          displayName: 'User One',
          username: 'user1',
          status: UserStatus.ACTIVE,
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUsers as unknown as UserModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as UserReadModel);

      const result = await repository.find({
        sortField: 'username',
        sortOrder: undefined,
      });

      expect(UserModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['username', 'ASC']],
        attributes: undefined,
        replacements: undefined,
      });
      expect(result.data).toEqual(mockUsers);
    });

    it('should handle null sortField and null sortOrder', async () => {
      const mockUsers: UserReadModel[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          signInType: SignInType.EMAIL,
          externalId: 'firebase-user-1',
          displayName: 'User One',
          username: 'user1',
          status: UserStatus.ACTIVE,
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUsers as unknown as UserModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as UserReadModel);

      const result = await repository.find({
        sortField: null as any,
        sortOrder: null as any,
      });

      expect(UserModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['email', 'ASC']],
        attributes: undefined,
        replacements: undefined,
      });
      expect(result.data).toEqual(mockUsers);
    });
  });

  describe('find - edge cases', () => {
    it('should handle empty results', async () => {
      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserModel.findAndCountAll).mockResolvedValue({
        count: 0 as unknown as any,
        rows: [],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as UserReadModel);

      const result = await repository.find({});

      expect(result.data).toHaveLength(0);
      expect(result.pagination.count).toBe(0);
    });

    it('should use default pagination when not provided', async () => {
      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserModel.findAndCountAll).mockResolvedValue({
        count: 0 as unknown as any,
        rows: [],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as UserReadModel);

      await repository.find({});

      expect(UserModel.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
          offset: 0,
        })
      );
    });

    it('should propagate database errors', async () => {
      const error = new Error('Database connection failed');
      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      const ReadUserModel = mockReadDatabase.models['User'] as typeof UserModel;
      vi.spyOn(ReadUserModel, 'findAndCountAll').mockRejectedValue(error);

      await expect(repository.find({})).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('findById - happy path', () => {
    it('should return user read model when found', async () => {
      const mockUser: UserReadModel = {
        id: 'user-1',
        email: 'user1@example.com',
        signInType: SignInType.EMAIL,
        externalId: 'firebase-user-1',
        displayName: 'User One',
        username: 'user1',
        status: UserStatus.ACTIVE,
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      };

      const mockUserModel = {
        toJSON: vi.fn().mockReturnValue(mockUser),
      } as unknown as UserModel;

      const ReadUserModel = mockReadDatabase.models['User'] as typeof UserModel;
      vi.spyOn(ReadUserModel, 'findByPk').mockResolvedValue(mockUserModel);

      const result = await repository.findById('user-1');

      expect(UserModel.findByPk).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('findById - edge cases', () => {
    it('should return undefined when user is not found', async () => {
      vi.mocked(UserModel.findByPk).mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(UserModel.findByPk).toHaveBeenCalledWith('non-existent-id');
      expect(result).toBeUndefined();
    });

    it('should propagate database errors', async () => {
      const error = new Error('Database connection failed');
      vi.mocked(UserModel.findByPk).mockRejectedValue(error);

      await expect(repository.findById('user-1')).rejects.toThrow(
        'Database connection failed'
      );
    });
  });
});
