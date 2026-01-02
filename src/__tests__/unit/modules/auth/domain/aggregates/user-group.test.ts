import { describe, expect, it } from 'vitest';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { UserGroup } from '@app/modules/auth/domain/aggregates/user-group';
import { UserGroupEventType } from '@app/modules/auth/domain/enums/user-group-event-type';

describe('UserGroup', () => {
  const id = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
  const createdBy = Uuid.create('550e8400-e29b-41d4-a716-446655440001');

  describe('setName', () => {
    it('should update name', () => {
      const userGroup = UserGroup.create({
        id,
        name: 'Old Name',
        createdBy,
      });

      userGroup.setName('New Name');

      expect(userGroup.name).toBe('New Name');
    });
  });

  describe('setDescription', () => {
    it('should update description', () => {
      const userGroup = UserGroup.create({
        id,
        name: 'Test Group',
        description: 'Old Description',
        createdBy,
      });

      userGroup.setDescription('New Description');

      expect(userGroup.description).toBe('New Description');
    });

    it('should clear description when undefined', () => {
      const userGroup = UserGroup.create({
        id,
        name: 'Test Group',
        description: 'Old Description',
        createdBy,
      });

      userGroup.setDescription(undefined);

      expect(userGroup.description).toBeUndefined();
    });
  });

  describe('domain events', () => {
    describe('create - CREATED event', () => {
      it('should register CREATED event when creating user group', () => {
        const userGroup = UserGroup.create({
          id,
          name: 'Test Group',
          description: 'Test Description',
          createdBy,
        });

        const events = userGroup.getEvents();

        expect(events).toHaveLength(1);
        expect(events[0]!).toBeDefined();
        expect(events[0]!.eventType).toBe(UserGroupEventType.CREATED);
        expect(events[0]!.aggregateId).toBe(id);
        expect(events[0]!.aggregateName).toBe('UserGroup');
        expect(events[0]!.data).toEqual({
          name: 'Test Group',
          description: 'Test Description',
        });
      });

      it('should register CREATED event without description', () => {
        const userGroup = UserGroup.create({
          id,
          name: 'Test Group',
          createdBy,
        });

        const events = userGroup.getEvents();

        expect(events).toHaveLength(1);
        expect(events[0]!).toBeDefined();
        expect(events[0]!.eventType).toBe(UserGroupEventType.CREATED);
        expect(events[0]!.data).toEqual({
          name: 'Test Group',
          description: undefined,
        });
      });
    });

    describe('setName - UPDATED event', () => {
      it('should register UPDATED event when setting name', () => {
        const userGroup = UserGroup.create({
          id,
          name: 'Old Name',
          createdBy,
        });

        userGroup.clearEvents();
        userGroup.setName('New Name');

        const events = userGroup.getEvents();

        expect(events).toHaveLength(1);
        expect(events[0]!).toBeDefined();
        expect(events[0]!.eventType).toBe(UserGroupEventType.UPDATED);
        expect(events[0]!.aggregateId).toBe(id);
        expect(events[0]!.aggregateName).toBe('UserGroup');
        expect(events[0]!.data).toEqual({
          field: 'name',
          value: 'New Name',
        });
      });
    });

    describe('setDescription - UPDATED event', () => {
      it('should register UPDATED event when setting description', () => {
        const userGroup = UserGroup.create({
          id,
          name: 'Test Group',
          createdBy,
        });

        userGroup.clearEvents();
        userGroup.setDescription('New Description');

        const events = userGroup.getEvents();

        expect(events).toHaveLength(1);
        expect(events[0]!).toBeDefined();
        expect(events[0]!.eventType).toBe(UserGroupEventType.UPDATED);
        expect(events[0]!.aggregateId).toBe(id);
        expect(events[0]!.aggregateName).toBe('UserGroup');
        expect(events[0]!.data).toEqual({
          field: 'description',
          value: 'New Description',
        });
      });

      it('should register UPDATED event when clearing description', () => {
        const userGroup = UserGroup.create({
          id,
          name: 'Test Group',
          description: 'Old Description',
          createdBy,
        });

        userGroup.clearEvents();
        userGroup.setDescription(undefined);

        const events = userGroup.getEvents();

        expect(events).toHaveLength(1);
        expect(events[0]!).toBeDefined();
        expect(events[0]!.eventType).toBe(UserGroupEventType.UPDATED);
        expect(events[0]!.data).toEqual({
          field: 'description',
          value: undefined,
        });
      });
    });

    describe('markForDeletion - DELETED event', () => {
      it('should register DELETED event when marking for deletion', () => {
        const userGroup = UserGroup.create({
          id,
          name: 'Test Group',
          description: 'Test Description',
          createdBy,
        });

        userGroup.clearEvents();
        userGroup.markForDeletion();

        const events = userGroup.getEvents();

        expect(events).toHaveLength(1);
        expect(events[0]!).toBeDefined();
        expect(events[0]!.eventType).toBe(UserGroupEventType.DELETED);
        expect(events[0]!.aggregateId).toBe(id);
        expect(events[0]!.aggregateName).toBe('UserGroup');
        expect(events[0]!.data).toEqual({});
      });
    });
  });

  describe('setName and setDescription together', () => {
    it('should update name only', () => {
      const userGroup = UserGroup.create({
        id,
        name: 'Old Name',
        description: 'Old Description',
        createdBy,
      });

      userGroup.setName('New Name');

      expect(userGroup.name).toBe('New Name');
      expect(userGroup.description).toBe('Old Description');
    });

    it('should update description only', () => {
      const userGroup = UserGroup.create({
        id,
        name: 'Test Group',
        description: 'Old Description',
        createdBy,
      });

      userGroup.setDescription('New Description');

      expect(userGroup.name).toBe('Test Group');
      expect(userGroup.description).toBe('New Description');
    });

    it('should update both name and description', () => {
      const userGroup = UserGroup.create({
        id,
        name: 'Old Name',
        description: 'Old Description',
        createdBy,
      });

      userGroup.setName('New Name');
      userGroup.setDescription('New Description');

      expect(userGroup.name).toBe('New Name');
      expect(userGroup.description).toBe('New Description');
    });
  });

  describe('addRole', () => {
    it('should register ROLE_ADDED event', () => {
      const userGroup = UserGroup.create({
        id,
        name: 'Test Group',
        createdBy,
      });

      const roleId = Uuid.create('550e8400-e29b-41d4-a716-446655440003');

      userGroup.clearEvents();
      userGroup.addRole(roleId);

      const events = userGroup.getEvents();

      expect(events).toHaveLength(1);
      expect(events[0]!).toBeDefined();
      expect(events[0]!.eventType).toBe(UserGroupEventType.ROLE_ADDED);
      expect(events[0]!.aggregateId).toBe(id);
      expect(events[0]!.aggregateName).toBe('UserGroup');
      expect(events[0]!.data).toEqual({
        roleId: roleId.getValue(),
      });
    });
  });

  describe('removeRole', () => {
    it('should register ROLE_REMOVED event', () => {
      const userGroup = UserGroup.create({
        id,
        name: 'Test Group',
        createdBy,
      });

      const roleId = Uuid.create('550e8400-e29b-41d4-a716-446655440003');

      userGroup.clearEvents();
      userGroup.removeRole(roleId);

      const events = userGroup.getEvents();

      expect(events).toHaveLength(1);
      expect(events[0]!).toBeDefined();
      expect(events[0]!.eventType).toBe(UserGroupEventType.ROLE_REMOVED);
      expect(events[0]!.aggregateId).toBe(id);
      expect(events[0]!.aggregateName).toBe('UserGroup');
      expect(events[0]!.data).toEqual({
        roleId: roleId.getValue(),
      });
    });
  });

  describe('toJson', () => {
    it('should convert user group to JSON object with all properties', () => {
      const createdAt = new Date('2024-01-01');
      const lastModifiedAt = new Date('2024-01-02');
      const userGroup = new UserGroup({
        id,
        name: 'Test Group',
        description: 'Test Description',
        version: 1,
        createdAt,
        lastModifiedAt,
        createdBy,
        lastModifiedBy: createdBy,
      });

      const json = userGroup.toJson();

      expect(json).toEqual({
        id: id.getValue(),
        name: 'Test Group',
        description: 'Test Description',
        version: 1,
        createdAt,
        lastModifiedAt,
        createdBy: createdBy.getValue(),
        lastModifiedBy: createdBy.getValue(),
      });
    });

    it('should convert user group to JSON object without description', () => {
      const createdAt = new Date('2024-01-01');
      const userGroup = new UserGroup({
        id,
        name: 'Test Group',
        version: 0,
        createdAt,
      });

      const json = userGroup.toJson();

      expect(json).toEqual({
        id: id.getValue(),
        name: 'Test Group',
        description: undefined,
        version: 0,
        createdAt,
        lastModifiedAt: undefined,
        createdBy: undefined,
        lastModifiedBy: undefined,
      });
    });
  });
});
