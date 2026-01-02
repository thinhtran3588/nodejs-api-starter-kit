import { describe, expect, it } from 'vitest';
import { pickFields } from '@app/common/utils/pick-fields';

describe('pickFields', () => {
  it('should return all fields when fields parameter is undefined', () => {
    const obj = {
      id: '123',
      name: 'Test',
      email: 'test@example.com',
    };

    const result = pickFields(obj, undefined);

    expect(result).toEqual(obj);
  });

  it('should return all fields when fields array is empty', () => {
    const obj = {
      id: '123',
      name: 'Test',
      email: 'test@example.com',
    };

    const result = pickFields(obj, []);

    expect(result).toEqual(obj);
  });

  it('should return only specified fields', () => {
    const obj = {
      id: '123',
      name: 'Test',
      email: 'test@example.com',
      status: 'active',
    };

    const result = pickFields(obj, ['id', 'name']);

    expect(result).toEqual({
      id: '123',
      name: 'Test',
    });
  });

  it('should include nonexistent fields as null', () => {
    const obj = {
      id: '123',
      name: 'Test',
    };

    const result = pickFields(obj, ['id', 'nonexistent', 'name']);

    expect(result).toEqual({
      id: '123',
      nonexistent: null,
      name: 'Test',
    });
  });

  it('should return all requested fields as null when none exist', () => {
    const obj = {
      id: '123',
      name: 'Test',
    };

    const result = pickFields(obj, ['nonexistent1', 'nonexistent2']);

    expect(result).toEqual({
      nonexistent1: null,
      nonexistent2: null,
    });
  });

  it('should convert undefined values to null for JSON compatibility', () => {
    const obj = {
      id: '123',
      name: undefined,
      email: 'test@example.com',
    };

    const result = pickFields(obj, ['id', 'name', 'email']);

    expect(result).toEqual({
      id: '123',
      name: null,
      email: 'test@example.com',
    });
  });

  it('should preserve the original object structure', () => {
    const obj = {
      id: '123',
      nested: {
        value: 'test',
      },
      array: [1, 2, 3],
    };

    const result = pickFields(obj, ['id', 'nested', 'array']);

    expect(result).toEqual({
      id: '123',
      nested: {
        value: 'test',
      },
      array: [1, 2, 3],
    });
  });
});
