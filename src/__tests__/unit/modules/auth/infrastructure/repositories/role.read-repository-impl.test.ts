import { DataTypes, literal, Op, Sequelize } from 'sequelize';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PAGINATION_DEFAULT_ITEMS_PER_PAGE } from '@app/common/constants';
import { buildFullTextSearch } from '@app/common/utils/full-text-search';
import { pickFields } from '@app/common/utils/pick-fields';
import type { RoleReadModel } from '@app/modules/auth/application/interfaces/queries/role.read-model';
import { RoleModel } from '@app/modules/auth/infrastructure/models/role.model';
import { RoleReadRepositoryImpl } from '@app/modules/auth/infrastructure/repositories/role.read-repository-impl';

vi.mock('@app/modules/auth/infrastructure/models/role.model');
vi.mock('@app/common/utils/full-text-search');
vi.mock('@app/common/utils/pick-fields');

describe('RoleReadRepositoryImpl', () => {
  let repository: RoleReadRepositoryImpl;
  let mockReadDatabase: Sequelize;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReadDatabase = new Sequelize({
      dialect: 'postgres',
      logging: false,
    });
    RoleModel.init(
      {
        id: { type: DataTypes.UUID, primaryKey: true },
        code: { type: DataTypes.STRING },
        name: { type: DataTypes.STRING },
        description: { type: DataTypes.TEXT },
        version: { type: DataTypes.INTEGER },
        createdAt: { type: DataTypes.DATE },
        createdBy: { type: DataTypes.UUID },
        lastModifiedAt: { type: DataTypes.DATE },
        lastModifiedBy: { type: DataTypes.STRING },
      },
      { sequelize: mockReadDatabase, modelName: 'Role', tableName: 'roles' }
    );
    // Ensure model is registered on Sequelize instance
    if (!mockReadDatabase.models['Role']) {
      mockReadDatabase.models['Role'] = RoleModel;
    }
    repository = new RoleReadRepositoryImpl(mockReadDatabase);
  });

  describe('find - happy path', () => {
    it('should return paginated roles without search term', async () => {
      const mockRoles: RoleReadModel[] = [
        {
          id: 'role-1',
          code: 'ADMIN',
          name: 'Admin',
          description: 'Administrator',
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
        {
          id: 'role-2',
          code: 'USER',
          name: 'User',
          description: 'Regular user',
          version: 1,
          createdAt: new Date('2024-01-02'),
          lastModifiedAt: new Date('2024-01-02'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(RoleModel.findAndCountAll).mockResolvedValue({
        count: 2 as unknown as any,
        rows: mockRoles as unknown as RoleModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as RoleReadModel);

      const result = await repository.find({});

      expect(buildFullTextSearch).toHaveBeenCalledWith(undefined);
      expect(RoleModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['name', 'ASC']],
        attributes: undefined,
        replacements: undefined,
      });
      expect(result.data).toHaveLength(2);
      expect(result.pagination.count).toBe(2);
      expect(result.pagination.pageIndex).toBe(0);
    });

    it('should return paginated roles with search term', async () => {
      const mockSearchCondition = literal('search condition');
      const mockRoles: RoleReadModel[] = [
        {
          id: 'role-1',
          code: 'ADMIN',
          name: 'Admin',
          description: 'Administrator',
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: mockSearchCondition,
        rankLiteral: undefined,
      });

      vi.mocked(RoleModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockRoles as unknown as RoleModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as RoleReadModel);

      const result = await repository.find({ searchTerm: 'admin' });

      expect(buildFullTextSearch).toHaveBeenCalledWith('admin');
      expect(RoleModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          [Op.and]: [mockSearchCondition],
        },
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['name', 'ASC']],
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

      vi.mocked(RoleModel.findAndCountAll).mockResolvedValue({
        count: 25 as unknown as any,
        rows: [],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as RoleReadModel);

      const result = await repository.find({
        pageIndex,
        itemsPerPage,
      });

      expect(RoleModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: itemsPerPage,
        offset: pageIndex * itemsPerPage,
        order: [['name', 'ASC']],
        attributes: undefined,
        replacements: undefined,
      });
      expect(result.pagination.pageIndex).toBe(pageIndex);
      expect(result.pagination.count).toBe(25);
    });

    it('should handle field selection', async () => {
      const fields: string[] = ['id', 'name'];
      const mockRoles: RoleReadModel[] = [
        {
          id: 'role-1',
          code: 'ADMIN',
          name: 'Admin',
        } as RoleReadModel,
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(RoleModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockRoles as unknown as RoleModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as RoleReadModel);

      const result = await repository.find({ fields });

      expect(RoleModel.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          attributes: expect.arrayContaining(['id', 'name']),
        })
      );
      expect(pickFields).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
    });

    it('should filter out id from fields array when selecting attributes', async () => {
      const fields: string[] = ['id', 'name', 'description'];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(RoleModel.findAndCountAll).mockResolvedValue({
        count: 0 as unknown as any,
        rows: [],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as RoleReadModel);

      await repository.find({ fields });

      expect(RoleModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['name', 'ASC']],
        attributes: expect.arrayContaining(['id', 'name', 'description']),
        replacements: undefined,
      });
    });

    it('should filter roles by userGroupId', async () => {
      const userGroupId = '550e8400-e29b-41d4-a716-446655440002';
      const mockRoles: RoleReadModel[] = [
        {
          id: 'role-1',
          code: 'ADMIN',
          name: 'Admin',
          description: 'Administrator',
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(RoleModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockRoles as unknown as RoleModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as RoleReadModel);

      const result = await repository.find({ userGroupId });

      expect(buildFullTextSearch).toHaveBeenCalledWith(undefined);
      expect(RoleModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          [Op.and]: [
            literal(
              `EXISTS (SELECT 1 FROM user_group_roles WHERE user_group_roles.role_id = "Role".id AND user_group_roles.user_group_id = :userGroupId)`
            ),
          ],
        },
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['name', 'ASC']],
        attributes: undefined,
        replacements: { userGroupId },
      });
      expect(result.data).toHaveLength(1);
      expect(result.pagination.count).toBe(1);
    });

    it('should combine search term and userGroupId filter', async () => {
      const userGroupId = '550e8400-e29b-41d4-a716-446655440002';
      const mockSearchCondition = literal('search condition');
      const mockRoles: RoleReadModel[] = [
        {
          id: 'role-1',
          code: 'ADMIN',
          name: 'Admin',
          description: 'Administrator',
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: mockSearchCondition,
        rankLiteral: undefined,
      });

      vi.mocked(RoleModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockRoles as unknown as RoleModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as RoleReadModel);

      const result = await repository.find({
        searchTerm: 'admin',
        userGroupId,
      });

      expect(buildFullTextSearch).toHaveBeenCalledWith('admin');
      expect(RoleModel.findAndCountAll).toHaveBeenCalledWith({
        where: {
          [Op.and]: [
            mockSearchCondition,
            literal(
              `EXISTS (SELECT 1 FROM user_group_roles WHERE user_group_roles.role_id = "Role".id AND user_group_roles.user_group_id = :userGroupId)`
            ),
          ],
        },
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['name', 'ASC']],
        attributes: undefined,
        replacements: { userGroupId },
      });
      expect(result.data).toHaveLength(1);
      expect(result.pagination.count).toBe(1);
    });

    it('should use provided sortField and sortOrder', async () => {
      const mockRoles: RoleReadModel[] = [
        {
          id: 'role-1',
          code: 'ADMIN',
          name: 'Admin',
          description: 'Administrator',
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(RoleModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockRoles as unknown as RoleModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as RoleReadModel);

      const result = await repository.find({
        sortField: 'code',
        sortOrder: 'DESC',
      });

      expect(RoleModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['code', 'DESC']],
        attributes: undefined,
        replacements: undefined,
      });
      expect(result.data).toEqual(mockRoles);
    });

    it('should use createdAt as sortField with ASC order', async () => {
      const mockRoles: RoleReadModel[] = [
        {
          id: 'role-1',
          code: 'ADMIN',
          name: 'Admin',
          description: 'Administrator',
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(RoleModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockRoles as unknown as RoleModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as RoleReadModel);

      const result = await repository.find({
        sortField: 'createdAt',
        sortOrder: 'ASC',
      });

      expect(RoleModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['createdAt', 'ASC']],
        attributes: undefined,
        replacements: undefined,
      });
      expect(result.data).toEqual(mockRoles);
    });

    it('should use lastModifiedAt as sortField with DESC order', async () => {
      const mockRoles: RoleReadModel[] = [
        {
          id: 'role-1',
          code: 'ADMIN',
          name: 'Admin',
          description: 'Administrator',
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(RoleModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockRoles as unknown as RoleModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as RoleReadModel);

      const result = await repository.find({
        sortField: 'lastModifiedAt',
        sortOrder: 'DESC',
      });

      expect(RoleModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['lastModifiedAt', 'DESC']],
        attributes: undefined,
        replacements: undefined,
      });
      expect(result.data).toEqual(mockRoles);
    });

    it('should default to ASC when sortField is provided but sortOrder is not', async () => {
      const mockRoles: RoleReadModel[] = [
        {
          id: 'role-1',
          code: 'ADMIN',
          name: 'Admin',
          description: 'Administrator',
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(RoleModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockRoles as unknown as RoleModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as RoleReadModel);

      const result = await repository.find({
        sortField: 'name',
      });

      expect(RoleModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['name', 'ASC']],
        attributes: undefined,
        replacements: undefined,
      });
      expect(result.data).toEqual(mockRoles);
    });

    it('should use default name and ASC when sortField and sortOrder are explicitly undefined', async () => {
      const mockRoles: RoleReadModel[] = [
        {
          id: 'role-1',
          code: 'ADMIN',
          name: 'Admin',
          description: 'Administrator',
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(RoleModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockRoles as unknown as RoleModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as RoleReadModel);

      const result = await repository.find({
        sortField: undefined,
        sortOrder: undefined,
      });

      expect(RoleModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['name', 'ASC']],
        attributes: undefined,
        replacements: undefined,
      });
      expect(result.data).toEqual(mockRoles);
    });

    it('should use default name when sortField is undefined but sortOrder is provided', async () => {
      const mockRoles: RoleReadModel[] = [
        {
          id: 'role-1',
          code: 'ADMIN',
          name: 'Admin',
          description: 'Administrator',
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(RoleModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockRoles as unknown as RoleModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as RoleReadModel);

      const result = await repository.find({
        sortField: undefined,
        sortOrder: 'DESC',
      });

      expect(RoleModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['name', 'DESC']],
        attributes: undefined,
        replacements: undefined,
      });
      expect(result.data).toEqual(mockRoles);
    });

    it('should use default ASC when sortField is provided but sortOrder is undefined', async () => {
      const mockRoles: RoleReadModel[] = [
        {
          id: 'role-1',
          code: 'ADMIN',
          name: 'Admin',
          description: 'Administrator',
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(RoleModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockRoles as unknown as RoleModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as RoleReadModel);

      const result = await repository.find({
        sortField: 'code',
        sortOrder: undefined,
      });

      expect(RoleModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['code', 'ASC']],
        attributes: undefined,
        replacements: undefined,
      });
      expect(result.data).toEqual(mockRoles);
    });

    it('should handle null sortField and null sortOrder', async () => {
      const mockRoles: RoleReadModel[] = [
        {
          id: 'role-1',
          code: 'ADMIN',
          name: 'Admin',
          description: 'Administrator',
          version: 1,
          createdAt: new Date('2024-01-01'),
          lastModifiedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(RoleModel.findAndCountAll).mockResolvedValue({
        count: 1 as unknown as any,
        rows: mockRoles as unknown as RoleModel[],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as RoleReadModel);

      const result = await repository.find({
        sortField: null as any,
        sortOrder: null as any,
      });

      expect(RoleModel.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: PAGINATION_DEFAULT_ITEMS_PER_PAGE,
        offset: 0,
        order: [['name', 'ASC']],
        attributes: undefined,
        replacements: undefined,
      });
      expect(result.data).toEqual(mockRoles);
    });
  });

  describe('find - edge cases', () => {
    it('should handle empty results', async () => {
      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(RoleModel.findAndCountAll).mockResolvedValue({
        count: 0 as unknown as any,
        rows: [],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as RoleReadModel);

      const result = await repository.find({});

      expect(result.data).toHaveLength(0);
      expect(result.pagination.count).toBe(0);
    });

    it('should use default pagination when not provided', async () => {
      vi.mocked(buildFullTextSearch).mockReturnValue({
        searchCondition: undefined,
        rankLiteral: undefined,
      });

      vi.mocked(RoleModel.findAndCountAll).mockResolvedValue({
        count: 0 as unknown as any,
        rows: [],
      });

      vi.mocked(pickFields).mockImplementation((obj) => obj as RoleReadModel);

      await repository.find({});

      expect(RoleModel.findAndCountAll).toHaveBeenCalledWith(
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

      vi.mocked(RoleModel.findAndCountAll).mockRejectedValue(error);

      await expect(repository.find({})).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('findById - happy path', () => {
    it('should return role read model when found', async () => {
      const mockRole: RoleReadModel = {
        id: 'role-1',
        code: 'ADMIN',
        name: 'Admin',
        description: 'Administrator',
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      };

      const mockRoleModel = {
        toJSON: vi.fn().mockReturnValue(mockRole),
      } as unknown as RoleModel;

      vi.mocked(RoleModel.findByPk).mockResolvedValue(mockRoleModel);

      const result = await repository.findById('role-1');

      expect(RoleModel.findByPk).toHaveBeenCalledWith('role-1');
      expect(result).toEqual(mockRole);
    });
  });

  describe('findById - edge cases', () => {
    it('should return undefined when role is not found', async () => {
      vi.mocked(RoleModel.findByPk).mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(RoleModel.findByPk).toHaveBeenCalledWith('non-existent-id');
      expect(result).toBeUndefined();
    });

    it('should propagate database errors', async () => {
      const error = new Error('Database connection failed');
      vi.mocked(RoleModel.findByPk).mockRejectedValue(error);

      await expect(repository.findById('role-1')).rejects.toThrow(
        'Database connection failed'
      );
    });
  });
});
