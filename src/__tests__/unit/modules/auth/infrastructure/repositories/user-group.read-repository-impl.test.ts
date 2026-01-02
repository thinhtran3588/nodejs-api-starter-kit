import { DataTypes, literal, Op, Sequelize } from 'sequelize';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PAGINATION_DEFAULT_ITEMS_PER_PAGE } from '@app/common/constants';
import { buildFullTextSearch } from '@app/common/utils/full-text-search';
import { pickFields } from '@app/common/utils/pick-fields';
import type { UserGroupReadModel } from '@app/modules/auth/application/interfaces/queries/user-group.read-model';
import { UserGroupModel } from '@app/modules/auth/infrastructure/models/user-group.model';
import { UserGroupReadRepositoryImpl } from '@app/modules/auth/infrastructure/repositories/user-group.read-repository-impl';

vi.mock('@app/modules/auth/infrastructure/models/user-group.model');
vi.mock('@app/common/utils/full-text-search');
vi.mock('@app/common/utils/pick-fields');

describe('UserGroupReadRepositoryImpl', () => {
  let repository: UserGroupReadRepositoryImpl;
  let mockReadDatabase: Sequelize;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReadDatabase = new Sequelize({
      dialect: 'postgres',
      logging: false,
    });
    UserGroupModel.init(
      {
        id: { type: DataTypes.UUID, primaryKey: true },
        name: { type: DataTypes.STRING },
        description: { type: DataTypes.TEXT },
        version: { type: DataTypes.INTEGER },
        createdAt: { type: DataTypes.DATE },
        createdBy: { type: DataTypes.UUID },
        lastModifiedAt: { type: DataTypes.DATE },
        lastModifiedBy: { type: DataTypes.STRING },
      },
      {
        sequelize: mockReadDatabase,
        modelName: 'UserGroup',
        tableName: 'user_groups',
      }
    );
    // Ensure model is registered on Sequelize instance
    if (!mockReadDatabase.models['UserGroup']) {
      mockReadDatabase.models['UserGroup'] = UserGroupModel;
    }
    repository = new UserGroupReadRepositoryImpl(mockReadDatabase);
  });

  describe('find - happy path', () => {
    it('should return paginated user groups without search term', async () => {
      const mockUserGroups: UserGroupReadModel[] = [
        {
          id: 'group-1',
          name: 'Admins',
          description: 'Administrator group',
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
        {
          id: 'group-2',
          name: 'Users',
          description: 'Regular users',
          version: 1,
          createdAt: new Date('2024-01-02'),
          lastModifiedAt: new Date('2024-01-02'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserGroupModel.findAndCountAll).mockResolvedValue({
        count: 2 as unknown as any,
        rows: mockUserGroups as unknown as UserGroupModel[],
      });

      vi.mocked(pickFields).mockImplementation(
        (obj) => obj as UserGroupReadModel
      );

      const result = await repository.find({});

      expect(buildFullTextSearch).toHaveBeenCalledWith(undefined);
      expect(UserGroupModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['name', 'ASC']],
        attributes: undefined,
      });
      expect(result.data).toHaveLength(2);
      expect(result.pagination.count).toBe(2);
      expect(result.pagination.pageIndex).toBe(0);
    });

    it('should return paginated user groups with search term', async () => {
      const mockSearchCondition = literal('search condition');
      const mockUserGroups: UserGroupReadModel[] = [
        {
          id: 'group-1',
          name: 'Admins',
          description: 'Administrator group',
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: mockSearchCondition,
        rankLiteral: undefined,
      });

      vi.mocked(UserGroupModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUserGroups as unknown as UserGroupModel[],
      });

      vi.mocked(pickFields).mockImplementation(
        (obj) => obj as UserGroupReadModel
      );

      const result = await repository.find({ searchTerm: 'admin' });

      expect(buildFullTextSearch).toHaveBeenCalledWith('admin');
      expect(UserGroupModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          [Op.and]: [mockSearchCondition],
        },
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['name', 'ASC']],
        attributes: undefined,
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

      vi.mocked(UserGroupModel.findAndCountAll).mockResolvedValue({
        count: 25 as unknown as any,
        rows: [],
      });

      vi.mocked(pickFields).mockImplementation(
        (obj) => obj as UserGroupReadModel
      );

      const result = await repository.find({
        pageIndex,
        itemsPerPage,
      });

      expect(UserGroupModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: itemsPerPage,
        offset: pageIndex * itemsPerPage,
        order: [['name', 'ASC']],
        attributes: undefined,
      });
      expect(result.pagination.pageIndex).toBe(pageIndex);
      expect(result.pagination.count).toBe(25);
    });

    it('should handle field selection', async () => {
      const fields: string[] = ['id', 'name'];
      const mockUserGroups: UserGroupReadModel[] = [
        {
          id: 'group-1',
          name: 'Admins',
        } as UserGroupReadModel,
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserGroupModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUserGroups as unknown as UserGroupModel[],
      });

      vi.mocked(pickFields).mockImplementation(
        (obj) => obj as UserGroupReadModel
      );

      const result = await repository.find({ fields });

      expect(UserGroupModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['name', 'ASC']],
        attributes: expect.arrayContaining(['id', 'name']),
      });
      expect(pickFields).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
    });

    it('should use provided sortField and sortOrder', async () => {
      const mockUserGroups: UserGroupReadModel[] = [
        {
          id: 'group-1',
          name: 'Admins',
          version: 1,
          createdAt: new Date('2024-01-01'),
        } as UserGroupReadModel,
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserGroupModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUserGroups as unknown as UserGroupModel[],
      });

      vi.mocked(pickFields).mockImplementation(
        (obj) => obj as UserGroupReadModel
      );

      const result = await repository.find({
        sortField: 'name',
        sortOrder: 'DESC',
      });

      expect(UserGroupModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['name', 'DESC']],
        attributes: undefined,
      });
      expect(result.data).toEqual(mockUserGroups);
    });

    it('should use createdAt as sortField with ASC order', async () => {
      const mockUserGroups: UserGroupReadModel[] = [
        {
          id: 'group-1',
          name: 'Admins',
          version: 1,
          createdAt: new Date('2024-01-01'),
        } as UserGroupReadModel,
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserGroupModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUserGroups as unknown as UserGroupModel[],
      });

      vi.mocked(pickFields).mockImplementation(
        (obj) => obj as UserGroupReadModel
      );

      const result = await repository.find({
        sortField: 'createdAt',
        sortOrder: 'ASC',
      });

      expect(UserGroupModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['createdAt', 'ASC']],
        attributes: undefined,
      });
      expect(result.data).toEqual(mockUserGroups);
    });

    it('should use lastModifiedAt as sortField with DESC order', async () => {
      const mockUserGroups: UserGroupReadModel[] = [
        {
          id: 'group-1',
          name: 'Admins',
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-02'),
        } as UserGroupReadModel,
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserGroupModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUserGroups as unknown as UserGroupModel[],
      });

      vi.mocked(pickFields).mockImplementation(
        (obj) => obj as UserGroupReadModel
      );

      const result = await repository.find({
        sortField: 'lastModifiedAt',
        sortOrder: 'DESC',
      });

      expect(UserGroupModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['lastModifiedAt', 'DESC']],
        attributes: undefined,
      });
      expect(result.data).toEqual(mockUserGroups);
    });

    it('should default to ASC when sortField is provided but sortOrder is not', async () => {
      const mockUserGroups: UserGroupReadModel[] = [
        {
          id: 'group-1',
          name: 'Admins',
          version: 1,
          createdAt: new Date('2024-01-01'),
        } as UserGroupReadModel,
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserGroupModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUserGroups as unknown as UserGroupModel[],
      });

      vi.mocked(pickFields).mockImplementation(
        (obj) => obj as UserGroupReadModel
      );

      const result = await repository.find({
        sortField: 'name',
      });

      expect(UserGroupModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['name', 'ASC']],
        attributes: undefined,
      });
      expect(result.data).toEqual(mockUserGroups);
    });

    it('should use default name and ASC when sortField and sortOrder are explicitly undefined', async () => {
      const mockUserGroups: UserGroupReadModel[] = [
        {
          id: 'group-1',
          name: 'Admins',
          version: 1,
          createdAt: new Date('2024-01-01'),
        } as UserGroupReadModel,
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserGroupModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUserGroups as unknown as UserGroupModel[],
      });

      vi.mocked(pickFields).mockImplementation(
        (obj) => obj as UserGroupReadModel
      );

      const result = await repository.find({
        sortField: undefined,
        sortOrder: undefined,
      });

      expect(UserGroupModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['name', 'ASC']],
        attributes: undefined,
      });
      expect(result.data).toEqual(mockUserGroups);
    });

    it('should use default name when sortField is undefined but sortOrder is provided', async () => {
      const mockUserGroups: UserGroupReadModel[] = [
        {
          id: 'group-1',
          name: 'Admins',
          version: 1,
          createdAt: new Date('2024-01-01'),
        } as UserGroupReadModel,
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserGroupModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUserGroups as unknown as UserGroupModel[],
      });

      vi.mocked(pickFields).mockImplementation(
        (obj) => obj as UserGroupReadModel
      );

      const result = await repository.find({
        sortField: undefined,
        sortOrder: 'DESC',
      });

      expect(UserGroupModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['name', 'DESC']],
        attributes: undefined,
      });
      expect(result.data).toEqual(mockUserGroups);
    });

    it('should use default ASC when sortField is provided but sortOrder is undefined', async () => {
      const mockUserGroups: UserGroupReadModel[] = [
        {
          id: 'group-1',
          name: 'Admins',
          version: 1,
          createdAt: new Date('2024-01-01'),
        } as UserGroupReadModel,
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserGroupModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUserGroups as unknown as UserGroupModel[],
      });

      vi.mocked(pickFields).mockImplementation(
        (obj) => obj as UserGroupReadModel
      );

      const result = await repository.find({
        sortField: 'name',
        sortOrder: undefined,
      });

      expect(UserGroupModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['name', 'ASC']],
        attributes: undefined,
      });
      expect(result.data).toEqual(mockUserGroups);
    });

    it('should handle null sortField and null sortOrder', async () => {
      const mockUserGroups: UserGroupReadModel[] = [
        {
          id: 'group-1',
          name: 'Admins',
          version: 1,
          createdAt: new Date('2024-01-01'),
        } as UserGroupReadModel,
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserGroupModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockUserGroups as unknown as UserGroupModel[],
      });

      vi.mocked(pickFields).mockImplementation(
        (obj) => obj as UserGroupReadModel
      );

      const result = await repository.find({
        sortField: null as any,
        sortOrder: null as any,
      });

      expect(UserGroupModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['name', 'ASC']],
        attributes: undefined,
      });
      expect(result.data).toEqual(mockUserGroups);
    });
  });

  describe('find - edge cases', () => {
    it('should handle empty results', async () => {
      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserGroupModel.findAndCountAll).mockResolvedValue({
        count: 0 as unknown as any,
        rows: [],
      });

      vi.mocked(pickFields).mockImplementation(
        (obj) => obj as UserGroupReadModel
      );

      const result = await repository.find({});

      expect(result.data).toHaveLength(0);
      expect(result.pagination.count).toBe(0);
    });

    it('should use default pagination when not provided', async () => {
      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(UserGroupModel.findAndCountAll).mockResolvedValue({
        count: 0 as unknown as any,
        rows: [],
      });

      vi.mocked(pickFields).mockImplementation(
        (obj) => obj as UserGroupReadModel
      );

      await repository.find({});

      expect(UserGroupModel.findAndCountAll).toHaveBeenCalledWith(
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

      vi.mocked(UserGroupModel.findAndCountAll).mockRejectedValue(error);

      await expect(repository.find({})).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('findById - happy path', () => {
    it('should return user group read model when found', async () => {
      const mockUserGroup: UserGroupReadModel = {
        id: 'group-1',
        name: 'Admins',
        description: 'Administrator group',
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      };

      const mockUserGroupModel = {
        toJSON: vi.fn().mockReturnValue(mockUserGroup),
      } as unknown as UserGroupModel;

      const ReadUserGroupModel = mockReadDatabase.models[
        'UserGroup'
      ] as typeof UserGroupModel;
      vi.spyOn(ReadUserGroupModel, 'findByPk').mockResolvedValue(
        mockUserGroupModel
      );

      const result = await repository.findById('group-1');

      expect(UserGroupModel.findByPk).toHaveBeenCalledWith('group-1');
      expect(result).toEqual(mockUserGroup);
    });
  });

  describe('findById - edge cases', () => {
    it('should return undefined when user group is not found', async () => {
      vi.mocked(UserGroupModel.findByPk).mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(UserGroupModel.findByPk).toHaveBeenCalledWith('non-existent-id');
      expect(result).toBeUndefined();
    });

    it('should propagate database errors', async () => {
      const error = new Error('Database connection failed');
      vi.mocked(UserGroupModel.findByPk).mockRejectedValue(error);

      await expect(repository.findById('group-1')).rejects.toThrow(
        'Database connection failed'
      );
    });
  });
});
