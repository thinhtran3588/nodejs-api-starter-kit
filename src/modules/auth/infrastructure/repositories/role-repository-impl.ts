import { eq } from 'drizzle-orm';
import type { DatabaseClient } from '@app/common';
import type { RoleRepository } from '@app/modules/auth/domain';
import { schema } from '@app/modules/auth/infrastructure/schema';

const { roles } = schema;

/**
 * Drizzle implementation of RoleRepository
 * Uses PostgreSQL database via Drizzle ORM
 */
export class RoleRepositoryImpl implements RoleRepository {
  private readonly writeDatabase: DatabaseClient;

  constructor({ writeDatabase }: { writeDatabase: DatabaseClient }) {
    this.writeDatabase = writeDatabase;
  }

  async roleExists(id: string): Promise<boolean> {
    const [role] = await this.writeDatabase
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);
    return Boolean(role);
  }
}
