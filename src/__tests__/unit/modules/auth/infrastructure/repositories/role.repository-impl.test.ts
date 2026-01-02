import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoleModel } from '@app/modules/auth/infrastructure/models/role.model';
import { RoleRepositoryImpl } from '@app/modules/auth/infrastructure/repositories/role.repository-impl';

vi.mock('@app/modules/auth/infrastructure/models/role.model');

describe('RoleRepositoryImpl', () => {
  let repository: RoleRepositoryImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new RoleRepositoryImpl();
  });

  describe('roleExists', () => {
    it('should return true when role exists', async () => {
      const mockRoleModel = {
        id: 'role-123',
      } as unknown as RoleModel;

      vi.mocked(RoleModel.findByPk).mockResolvedValue(mockRoleModel);

      const result = await repository.roleExists('role-123');

      expect(RoleModel.findByPk).toHaveBeenCalledWith('role-123', {
        attributes: ['id'],
      });
      expect(result).toBe(true);
    });

    it('should return false when role does not exist', async () => {
      vi.mocked(RoleModel.findByPk).mockResolvedValue(null);

      const result = await repository.roleExists('role-123');

      expect(result).toBe(false);
    });

    it('should return false when role ID is empty string', async () => {
      vi.mocked(RoleModel.findByPk).mockResolvedValue(null);

      const result = await repository.roleExists('');

      expect(RoleModel.findByPk).toHaveBeenCalledWith('', {
        attributes: ['id'],
      });
      expect(result).toBe(false);
    });

    it('should propagate error when findByPk throws', async () => {
      const error = new Error('Database error');
      vi.mocked(RoleModel.findByPk).mockRejectedValue(error);

      await expect(repository.roleExists('role-123')).rejects.toThrow(
        'Database error'
      );
    });
  });
});
