import { describe, expect, it } from 'vitest';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { ValidationException } from '@app/common/utils/exceptions';
import { User } from '@app/modules/auth/domain/aggregates/user';
import { AuthExceptionCode } from '@app/modules/auth/domain/enums/auth-exception-code';
import { SignInType } from '@app/modules/auth/domain/enums/sign-in-type';
import { UserEventType } from '@app/modules/auth/domain/enums/user-event-type';
import { UserStatus } from '@app/modules/auth/domain/enums/user-status';
import { Email } from '@app/modules/auth/domain/value-objects/email';
import { Username } from '@app/modules/auth/domain/value-objects/username';

describe('User', () => {
  const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
  const userEmail = Email.create('test@example.com');
  const externalId = 'firebase-user-123';
  const username = Username.create('testuser123');

  describe('create - happy path', () => {
    it('should create a user with all fields', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        username,
        displayName: 'Test User',
        status: UserStatus.ACTIVE,
      });

      expect(user.id.getValue()).toBe(userId.getValue());
      expect(user.email.getValue()).toBe('test@example.com');
      expect(user.signInType).toBe(SignInType.EMAIL);
      expect(user.externalId).toBe(externalId);
      expect(user.username?.getValue()).toBe('testuser123');
      expect(user.displayName).toBe('Test User');
      expect(user.status).toBe(UserStatus.ACTIVE);
    });

    it('should create a user with minimal fields', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
      });

      expect(user.id.getValue()).toBe(userId.getValue());
      expect(user.email.getValue()).toBe('test@example.com');
      expect(user.status).toBe(UserStatus.ACTIVE);
    });

    it('should use default ACTIVE status when status is undefined', () => {
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: undefined,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
      });

      expect(user.status).toBe(UserStatus.ACTIVE);
    });
  });

  describe('markForDeletion', () => {
    it('should mark user as deleted', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.ACTIVE,
      });

      user.markForDeletion();

      expect(user.status).toBe(UserStatus.DELETED);
      expect(user.isDeleted()).toBe(true);
    });

    it('should throw ValidationException when user is already deleted', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DELETED,
      });

      try {
        user.markForDeletion();
        expect.fail('Should have thrown ValidationException');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        if (error instanceof ValidationException) {
          expect(error.code).toBe(AuthExceptionCode.USER_ALREADY_DELETED);
        }
      }
    });
  });

  describe('setUsername', () => {
    it('should update username', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
      });

      const newUsername = Username.create('newusername');
      user.setUsername(newUsername);

      expect(user.username?.getValue()).toBe('newusername');
    });

    it('should clear username when undefined', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        username,
      });

      user.setUsername(undefined);

      expect(user.username).toBeUndefined();
    });

    it('should throw ValidationException when user is deleted', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DELETED,
      });

      const newUsername = Username.create('newusername');
      expect(() => user.setUsername(newUsername)).toThrow(ValidationException);
      expect(() => user.setUsername(newUsername)).toThrow(
        AuthExceptionCode.USER_DELETED
      );
    });
  });

  describe('setDisplayName', () => {
    it('should update display name', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
      });

      user.setDisplayName('New Name');

      expect(user.displayName).toBe('New Name');
    });

    it('should clear display name when undefined', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        displayName: 'Old Name',
      });

      user.setDisplayName(undefined);

      expect(user.displayName).toBeUndefined();
    });

    it('should throw ValidationException when user is deleted', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DELETED,
      });

      expect(() => user.setDisplayName('New Name')).toThrow(
        ValidationException
      );
      expect(() => user.setDisplayName('New Name')).toThrow(
        AuthExceptionCode.USER_DELETED
      );
    });
  });

  describe('ensureDisabled', () => {
    it('should not throw when user is disabled', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DISABLED,
      });

      expect(() => user.ensureDisabled()).not.toThrow();
    });

    it('should throw ValidationException when user is not disabled', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.ACTIVE,
      });

      expect(() => user.ensureDisabled()).toThrow(ValidationException);
      expect(() => user.ensureDisabled()).toThrow(
        AuthExceptionCode.USER_MUST_BE_DISABLED
      );
    });

    it('should throw ValidationException when user is deleted', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DELETED,
      });

      expect(() => user.ensureDisabled()).toThrow(ValidationException);
    });
  });

  describe('isActive', () => {
    it('should return true when user is active', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.ACTIVE,
      });

      expect(user.isActive()).toBe(true);
    });

    it('should return false when user is disabled', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DISABLED,
      });

      expect(user.isActive()).toBe(false);
    });

    it('should return false when user is deleted', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DELETED,
      });

      expect(user.isActive()).toBe(false);
    });
  });

  describe('isDisabled', () => {
    it('should return true when user is disabled', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DISABLED,
      });

      expect(user.isDisabled()).toBe(true);
    });

    it('should return false when user is active', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.ACTIVE,
      });

      expect(user.isDisabled()).toBe(false);
    });

    it('should return false when user is deleted', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DELETED,
      });

      expect(user.isDisabled()).toBe(false);
    });
  });

  describe('isDeleted', () => {
    it('should return true when user is deleted', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DELETED,
      });

      expect(user.isDeleted()).toBe(true);
    });

    it('should return false when user is active', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.ACTIVE,
      });

      expect(user.isDeleted()).toBe(false);
    });

    it('should return false when user is disabled', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DISABLED,
      });

      expect(user.isDeleted()).toBe(false);
    });
  });

  describe('ensureActive', () => {
    it('should not throw when user is active', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.ACTIVE,
      });

      expect(() => user.ensureActive()).not.toThrow();
    });

    it('should throw ValidationException when user is disabled', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DISABLED,
      });

      expect(() => user.ensureActive()).toThrow(ValidationException);
      expect(() => user.ensureActive()).toThrow(
        AuthExceptionCode.USER_MUST_BE_ACTIVE
      );
    });

    it('should throw ValidationException when user is deleted', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DELETED,
      });

      expect(() => user.ensureActive()).toThrow(ValidationException);
      expect(() => user.ensureActive()).toThrow(
        AuthExceptionCode.USER_MUST_BE_ACTIVE
      );
    });
  });

  describe('ensureNotDeleted', () => {
    it('should not throw when user is active', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.ACTIVE,
      });

      expect(() => user.ensureNotDeleted()).not.toThrow();
    });

    it('should not throw when user is disabled', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DISABLED,
      });

      expect(() => user.ensureNotDeleted()).not.toThrow();
    });

    it('should throw ValidationException when user is deleted', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DELETED,
      });

      expect(() => user.ensureNotDeleted()).toThrow(ValidationException);
      expect(() => user.ensureNotDeleted()).toThrow(
        AuthExceptionCode.USER_DELETED
      );
    });
  });

  describe('disable', () => {
    it('should disable an active user', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.ACTIVE,
      });

      user.disable();

      expect(user.status).toBe(UserStatus.DISABLED);
      expect(user.isDisabled()).toBe(true);
      expect(user.isActive()).toBe(false);
    });

    it('should throw ValidationException when user is not active', () => {
      const disabledUser = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DISABLED,
      });

      expect(() => disabledUser.disable()).toThrow(ValidationException);
      expect(() => disabledUser.disable()).toThrow(
        AuthExceptionCode.USER_MUST_BE_ACTIVE
      );
    });

    it('should throw ValidationException when user is deleted', () => {
      const deletedUser = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DELETED,
      });

      expect(() => deletedUser.disable()).toThrow(ValidationException);
      expect(() => deletedUser.disable()).toThrow(
        AuthExceptionCode.USER_MUST_BE_ACTIVE
      );
    });
  });

  describe('activate', () => {
    it('should activate a disabled user', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DISABLED,
      });

      user.activate();

      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.isActive()).toBe(true);
      expect(user.isDisabled()).toBe(false);
    });

    it('should throw ValidationException when user is not disabled', () => {
      const activeUser = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.ACTIVE,
      });

      expect(() => activeUser.activate()).toThrow(ValidationException);
      expect(() => activeUser.activate()).toThrow(
        AuthExceptionCode.USER_MUST_BE_DISABLED
      );
    });

    it('should throw ValidationException when user is deleted', () => {
      const deletedUser = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        status: UserStatus.DELETED,
      });

      expect(() => deletedUser.activate()).toThrow(ValidationException);
      expect(() => deletedUser.activate()).toThrow(
        AuthExceptionCode.USER_MUST_BE_DISABLED
      );
    });
  });

  describe('addedToUserGroup', () => {
    it('should register ADDED_TO_USER_GROUP event', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
      });

      const userGroupId = Uuid.create('550e8400-e29b-41d4-a716-446655440001');

      user.clearEvents();
      user.addedToUserGroup(userGroupId);

      const events = user.getEvents();

      expect(events).toHaveLength(1);
      expect(events[0]!).toBeDefined();
      expect(events[0]!.eventType).toBe(UserEventType.ADDED_TO_USER_GROUP);
      expect(events[0]!.aggregateId).toBe(userId);
      expect(events[0]!.aggregateName).toBe('User');
      expect(events[0]!.data).toEqual({
        userGroupId: userGroupId.getValue(),
      });
    });
  });

  describe('removedFromUserGroup', () => {
    it('should register REMOVED_FROM_USER_GROUP event', () => {
      const user = User.create({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
      });

      const userGroupId = Uuid.create('550e8400-e29b-41d4-a716-446655440001');

      user.clearEvents();
      user.removedFromUserGroup(userGroupId);

      const events = user.getEvents();

      expect(events).toHaveLength(1);
      expect(events[0]!).toBeDefined();
      expect(events[0]!.eventType).toBe(UserEventType.REMOVED_FROM_USER_GROUP);
      expect(events[0]!.aggregateId).toBe(userId);
      expect(events[0]!.aggregateName).toBe('User');
      expect(events[0]!.data).toEqual({
        userGroupId: userGroupId.getValue(),
      });
    });
  });

  describe('toJson', () => {
    it('should convert user to JSON object with all properties', () => {
      const createdAt = new Date('2024-01-01');
      const lastModifiedAt = new Date('2024-01-02');
      const createdByUuid = Uuid.create('550e8400-e29b-41d4-a716-446655440001');
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        username,
        displayName: 'Test User',
        status: UserStatus.ACTIVE,
        version: 1,
        createdAt,
        lastModifiedAt,
        createdBy: createdByUuid,
        lastModifiedBy: createdByUuid,
      });

      const json = user.toJson();

      expect(json).toEqual({
        id: userId.getValue(),
        email: 'test@example.com',
        signInType: SignInType.EMAIL,
        externalId,
        username: 'testuser123',
        displayName: 'Test User',
        status: UserStatus.ACTIVE,
        version: 1,
        createdAt,
        lastModifiedAt,
        createdBy: createdByUuid.getValue(),
        lastModifiedBy: createdByUuid.getValue(),
      });
    });

    it('should convert user to JSON object with minimal properties', () => {
      const createdAt = new Date('2024-01-01');
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.EMAIL,
        externalId,
        version: 0,
        createdAt,
      });

      const json = user.toJson();

      expect(json).toEqual({
        id: userId.getValue(),
        email: 'test@example.com',
        signInType: SignInType.EMAIL,
        externalId,
        username: undefined,
        displayName: undefined,
        status: UserStatus.ACTIVE,
        version: 0,
        createdAt,
        lastModifiedAt: undefined,
        createdBy: undefined,
        lastModifiedBy: undefined,
      });
    });

    it('should convert user to JSON object with undefined username', () => {
      const createdAt = new Date('2024-01-01');
      const user = new User({
        id: userId,
        email: userEmail,
        signInType: SignInType.GOOGLE,
        externalId,
        displayName: 'Test User',
        version: 0,
        createdAt,
      });

      const json = user.toJson();

      expect(json['username']).toBeUndefined();
      expect(json['displayName']).toBe('Test User');
    });
  });
});
