import { describe, expect, it } from 'vitest';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import { Role } from '@app/modules/auth/domain/aggregates/role';

describe('Role', () => {
  const userId = Uuid.create('550e8400-e29b-41d4-a716-446655440000');
  const userIdString = userId.getValue();

  describe('constructor', () => {
    it('should create role with all properties', () => {
      const role = new Role({
        id: userId,
        code: 'ADMIN',
        name: 'Admin',
        description: 'Administrator role',
        version: 1,
        createdAt: new Date('2024-01-01'),
        lastModifiedAt: new Date('2024-01-01'),
        createdBy: userId,
        lastModifiedBy: userId,
      });

      expect(role.id).toBeInstanceOf(Uuid);
      expect(role.id.getValue()).toBe(userIdString);
      expect(role.code).toBe('ADMIN');
      expect(role.name).toBe('Admin');
      expect(role.description).toBe('Administrator role');
      expect(role.version).toBe(1);
      expect(role.createdAt).toEqual(new Date('2024-01-01'));
      expect(role.lastModifiedAt).toEqual(new Date('2024-01-01'));
      expect(role.createdBy).toBe(userId);
      expect(role.lastModifiedBy).toBe(userId);
    });

    it('should create role with minimal properties', () => {
      const role = new Role({
        id: userId,
        code: 'USER',
        name: 'User',
        description: 'Regular user',
        version: 1,
        createdAt: new Date('2024-01-01'),
      });

      expect(role.code).toBe('USER');
      expect(role.name).toBe('User');
      expect(role.description).toBe('Regular user');
    });

    it('should create role with empty description', () => {
      const role = new Role({
        id: userId,
        code: 'GUEST',
        name: 'Guest',
        description: '',
        version: 1,
        createdAt: new Date('2024-01-01'),
      });

      expect(role.code).toBe('GUEST');
      expect(role.description).toBe('');
    });
  });

  describe('getters', () => {
    it('should return code via getter', () => {
      const role = new Role({
        id: userId,
        code: 'MANAGER',
        name: 'Manager',
        description: 'Manager role',
        version: 1,
        createdAt: new Date('2024-01-01'),
      });

      expect(role.code).toBe('MANAGER');
    });

    it('should return name via getter', () => {
      const role = new Role({
        id: userId,
        code: 'MANAGER',
        name: 'Manager',
        description: 'Manager role',
        version: 1,
        createdAt: new Date('2024-01-01'),
      });

      expect(role.name).toBe('Manager');
    });

    it('should return description via getter', () => {
      const role = new Role({
        id: userId,
        code: 'VIEWER',
        name: 'Viewer',
        description: 'Viewer role',
        version: 1,
        createdAt: new Date('2024-01-01'),
      });

      expect(role.description).toBe('Viewer role');
    });
  });

  describe('constants', () => {
    it('should have NAME_MAX_LENGTH constant', () => {
      expect(Role.NAME_MAX_LENGTH).toBe(255);
    });

    it('should have DESCRIPTION_MAX_LENGTH constant', () => {
      expect(Role.DESCRIPTION_MAX_LENGTH).toBe(1000);
    });
  });

  describe('inheritance from BaseAggregate', () => {
    it('should inherit id property', () => {
      const role = new Role({
        id: userId,
        code: 'TEST',
        name: 'Test',
        description: 'Test role',
        version: 1,
        createdAt: new Date('2024-01-01'),
      });

      expect(role.id).toBeInstanceOf(Uuid);
      expect(role.id.getValue()).toBe(userIdString);
    });

    it('should inherit version property', () => {
      const role = new Role({
        id: userId,
        code: 'TEST',
        name: 'Test',
        description: 'Test role',
        version: 5,
        createdAt: new Date('2024-01-01'),
      });

      expect(role.version).toBe(5);
    });

    it('should inherit createdAt property', () => {
      const createdAt = new Date('2024-01-01');
      const role = new Role({
        id: userId,
        code: 'TEST',
        name: 'Test',
        description: 'Test role',
        version: 1,
        createdAt,
      });

      expect(role.createdAt).toEqual(createdAt);
    });
  });

  describe('toJson', () => {
    it('should convert role to JSON object with all properties', () => {
      const createdAt = new Date('2024-01-01');
      const lastModifiedAt = new Date('2024-01-02');
      const role = new Role({
        id: userId,
        code: 'ADMIN',
        name: 'Administrator',
        description: 'Admin role',
        version: 1,
        createdAt,
        lastModifiedAt,
        createdBy: userId,
        lastModifiedBy: userId,
      });

      const json = role.toJson();

      expect(json).toEqual({
        id: userIdString,
        code: 'ADMIN',
        name: 'Administrator',
        description: 'Admin role',
        version: 1,
        createdAt,
        lastModifiedAt,
        createdBy: userIdString,
        lastModifiedBy: userIdString,
      });
    });

    it('should convert role to JSON object with minimal properties', () => {
      const createdAt = new Date('2024-01-01');
      const role = new Role({
        id: userId,
        code: 'USER',
        name: 'User',
        description: 'Regular user',
        version: 0,
        createdAt,
      });

      const json = role.toJson();

      expect(json).toEqual({
        id: userIdString,
        code: 'USER',
        name: 'User',
        description: 'Regular user',
        version: 0,
        createdAt,
        lastModifiedAt: undefined,
        createdBy: undefined,
        lastModifiedBy: undefined,
      });
    });
  });
});
