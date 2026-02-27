import { and, eq, ne, type InferSelectModel } from 'drizzle-orm';
import {
  BaseRepositoryImpl,
  extractBaseAggregateParams,
  SystemExceptionCode,
  ValidationException,
  type DatabaseClient,
  type DatabaseTransaction,
  type DomainEventRepository,
  type Uuid,
} from '@app/common';
import {
  Email,
  User,
  Username,
  UserStatus,
  type ExternalAuthenticationService,
  type SignInType,
  type UserRepository,
} from '@app/modules/auth/domain';
import { schema } from '@app/modules/auth/infrastructure/schema';

const { userGroupUsers, users, usersPendingDeletion } = schema;

/**
 * Drizzle implementation of UserRepository
 * Uses PostgreSQL database via Drizzle ORM
 */
export class UserRepositoryImpl
  extends BaseRepositoryImpl<User, typeof users>
  implements UserRepository
{
  constructor({
    writeDatabase,
    domainEventRepository,
  }: {
    writeDatabase: DatabaseClient;
    domainEventRepository: DomainEventRepository;
    externalAuthenticationService: ExternalAuthenticationService;
  }) {
    super({ writeDatabase, domainEventRepository });
  }

  protected getAggregateName(): string {
    return 'User';
  }

  protected getTable(): typeof users {
    return users;
  }

  /**
   * Convert database row to domain User aggregate
   */
  protected toDomain(userModel: InferSelectModel<typeof users>): User {
    const emailResult = Email.tryCreate(userModel.email);
    if (!emailResult.email) {
      throw new ValidationException(
        SystemExceptionCode.DATA_CORRUPTION_ERROR,
        { field: 'email', value: userModel.email },
        `Invalid email in database: ${userModel.email}`
      );
    }

    const usernameResult = userModel.username
      ? Username.tryCreate(userModel.username)
      : undefined;

    if (usernameResult?.error) {
      throw new ValidationException(
        SystemExceptionCode.DATA_CORRUPTION_ERROR,
        { field: 'username', value: userModel.username },
        `Invalid username in database: ${userModel.username}`
      );
    }

    return new User({
      ...extractBaseAggregateParams(userModel),
      email: emailResult.email,
      signInType: userModel.signInType as SignInType,
      externalId: userModel.externalId,
      username: usernameResult?.username,
      displayName: userModel.displayName ?? undefined,
      status: (userModel.status as UserStatus) ?? UserStatus.ACTIVE,
    });
  }

  // ============================================================================
  // Persistence Operations
  // ============================================================================

  override async save(
    user: User,
    postSaveCallback?: (transaction: DatabaseTransaction) => Promise<void>
  ): Promise<void> {
    await super.save(user, async (transaction) => {
      if (user.status === UserStatus.DELETED) {
        await transaction
          .insert(usersPendingDeletion)
          .values({ id: user.id.getValue() })
          .onConflictDoNothing();
      }
      if (postSaveCallback) {
        await postSaveCallback(transaction);
      }
    });
  }

  // ============================================================================
  // Repository Interface Methods
  // ============================================================================

  override async delete(_aggregate: User): Promise<void> {
    await Promise.reject(
      new Error(
        'delete() is not supported for UserRepository. Use markForDeletion() on the aggregate instead.'
      )
    );
  }

  // ============================================================================
  // Existence Checks
  // ============================================================================

  async findByEmail(email: Email): Promise<User | undefined> {
    const [userModel] = await this.writeDatabase
      .select()
      .from(users)
      .where(eq(users.email, email.getValue()))
      .limit(1);
    if (!userModel) {
      return undefined;
    }
    return this.toDomain(userModel);
  }

  async findByExternalId(externalId: string): Promise<User | undefined> {
    const [userModel] = await this.writeDatabase
      .select()
      .from(users)
      .where(eq(users.externalId, externalId))
      .limit(1);
    if (!userModel) {
      return undefined;
    }
    return this.toDomain(userModel);
  }

  async findByUsername(username: Username): Promise<User | undefined> {
    const [userModel] = await this.writeDatabase
      .select()
      .from(users)
      .where(eq(users.username, username.getValue()))
      .limit(1);
    if (!userModel) {
      return undefined;
    }
    return this.toDomain(userModel);
  }

  async emailExists(email: Email): Promise<boolean> {
    const [existingUser] = await this.writeDatabase
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.getValue()))
      .limit(1);
    return Boolean(existingUser);
  }

  async usernameExists(
    username: Username,
    excludeUserId?: Uuid
  ): Promise<boolean> {
    const baseCondition = eq(users.username, username.getValue());
    const whereCondition = excludeUserId
      ? and(baseCondition, ne(users.id, excludeUserId.getValue()))
      : baseCondition;
    const [userModel] = await this.writeDatabase
      .select({ id: users.id })
      .from(users)
      .where(whereCondition)
      .limit(1);
    return Boolean(userModel);
  }

  // ============================================================================
  // User Group Operations
  // ============================================================================

  async addToGroup(
    userId: Uuid,
    userGroupId: Uuid,
    transaction?: DatabaseTransaction
  ): Promise<void> {
    const executor = transaction ?? this.writeDatabase;
    await executor.insert(userGroupUsers).values({
      userGroupId: userGroupId.getValue(),
      userId: userId.getValue(),
      createdAt: new Date(),
    });
  }

  async removeFromGroup(
    userId: Uuid,
    userGroupId: Uuid,
    transaction?: DatabaseTransaction
  ): Promise<void> {
    const executor = transaction ?? this.writeDatabase;
    await executor
      .delete(userGroupUsers)
      .where(
        and(
          eq(userGroupUsers.userGroupId, userGroupId.getValue()),
          eq(userGroupUsers.userId, userId.getValue())
        )
      );
  }
}
