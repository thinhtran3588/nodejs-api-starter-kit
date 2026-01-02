import type { RoleRepository } from '@app/modules/auth/domain/interfaces/repositories/role.repository';
import { RoleModel } from '@app/modules/auth/infrastructure/models/role.model';

/**
 * Sequelize implementation of RoleRepository
 * Uses PostgreSQL database via Sequelize ORM
 */
export class RoleRepositoryImpl implements RoleRepository {
  async roleExists(id: string): Promise<boolean> {
    const roleModel = await RoleModel.findByPk(id, {
      attributes: ['id'],
    });
    return Boolean(roleModel);
  }
}
