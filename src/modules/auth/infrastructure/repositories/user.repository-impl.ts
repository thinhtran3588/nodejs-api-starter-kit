import { Op, Transaction, type Model, type ModelStatic } from 'sequelize';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { SystemExceptionCode } from '@app/common/enums/system-exception-code';
import { BaseRepository } from '@app/common/infrastructure/repositories/base-repository';
import type { DomainEventRepository } from '@app/common/infrastructure/repositories/domain-event.repository';
import { extractBaseAggregateParams } from '@app/common/infrastructure/repositories/extract-base-aggregate-params';
import { ValidationException } from '@app/common/utils/exceptions';
import { User } from '@app/modules/auth/domain/aggregates/user';
import { SignInType } from '@app/modules/auth/domain/enums/sign-in-type';
import { UserStatus } from '@app/modules/auth/domain/enums/user-status';
import type { UserRepository } from '@app/modules/auth/domain/interfaces/repositories/user.repository';
import type { ExternalAuthenticationService } from '@app/modules/auth/domain/interfaces/services/external-authentication.service';
import { Email } from '@app/modules/auth/domain/value-objects/email';
import { Username } from '@app/modules/auth/domain/value-objects/username';
import { UserGroupUserModel } from '@app/modules/auth/infrastructure/models/user-group-user.model';
import { UserPendingDeletionModel } from '@app/modules/auth/infrastructure/models/user-pending-deletion.model';
import { UserModel } from '@app/modules/auth/infrastructure/models/user.model';

/**
 * Sequelize implementation of UserRepository
 * Uses PostgreSQL database via Sequelize ORM
 */
export class UserRepositoryImpl
  extends BaseRepository<User>
  implements UserRepository
{
  constructor(
    domainEventRepository: DomainEventRepository,
    private readonly externalAuthenticationService: ExternalAuthenticationService
  ) {
    super(domainEventRepository);
  }

  protected getAggregateName(): string {
    return 'User';
  }

  protected getModel(): ModelStatic<Model> {
    return UserModel;
  }

  /**
   * Convert Sequelize model to domain User aggregate
   */
  protected toDomain(userModel: UserModel): User {
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
    postSaveCallback?: (transaction: Transaction) => Promise<void>
  ): Promise<void> {
    await super.save(user, async (transaction) => {
      if (user.status === UserStatus.DELETED) {
        await UserPendingDeletionModel.findOrCreate({
          where: { id: user.id.getValue() },
          defaults: { id: user.id.getValue() },
          transaction,
        });
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
    const userModel = await UserModel.findOne({
      where: {
        email: email.getValue(),
      },
    });
    if (!userModel) {
      return undefined;
    }
    return this.toDomain(userModel);
  }

  async findByExternalId(externalId: string): Promise<User | undefined> {
    const userModel = await UserModel.findOne({
      where: {
        externalId,
      },
    });
    if (!userModel) {
      return undefined;
    }
    return this.toDomain(userModel);
  }

  async findByUsername(username: Username): Promise<User | undefined> {
    const userModel = await UserModel.findOne({
      where: {
        username: username.getValue(),
      },
    });
    if (!userModel) {
      return undefined;
    }
    return this.toDomain(userModel);
  }

  async emailExists(email: Email): Promise<boolean> {
    const existingUser = await UserModel.findOne({
      where: {
        email: email.getValue(),
      },
      attributes: ['id'],
    });
    if (existingUser) {
      return true;
    }

    const existingFirebaseUser =
      await this.externalAuthenticationService.findUserByEmail(
        email.getValue()
      );
    return existingFirebaseUser !== undefined;
  }

  async usernameExists(
    username: Username,
    excludeUserId?: Uuid
  ): Promise<boolean> {
    const whereClause: {
      username: string;
      id?: { [Op.ne]: string };
    } = {
      username: username.getValue(),
    };

    if (excludeUserId) {
      whereClause.id = { [Op.ne]: excludeUserId.getValue() };
    }

    const userModel = await UserModel.findOne({
      where: whereClause,
      attributes: ['id'],
    });
    return Boolean(userModel);
  }

  // ============================================================================
  // User Group Operations
  // ============================================================================

  async addToGroup(
    userId: Uuid,
    userGroupId: Uuid,
    transaction?: Transaction
  ): Promise<void> {
    await UserGroupUserModel.create(
      {
        userGroupId: userGroupId.getValue(),
        userId: userId.getValue(),
        createdAt: new Date(),
      },
      { transaction }
    );
  }

  async removeFromGroup(
    userId: Uuid,
    userGroupId: Uuid,
    transaction?: Transaction
  ): Promise<void> {
    await UserGroupUserModel.destroy({
      where: {
        userGroupId: userGroupId.getValue(),
        userId: userId.getValue(),
      },
      transaction,
    });
  }
}
