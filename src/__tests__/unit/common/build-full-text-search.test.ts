import { describe, expect, it } from 'vitest';
import { buildFullTextSearch } from '@app/common';

describe('buildFullTextSearch', () => {
  it('returns undefined literals for empty search term', () => {
    const result = buildFullTextSearch('  ');

    expect(result.searchCondition).toBeUndefined();
    expect(result.rankLiteral).toBeUndefined();
  });

  it('returns SQL literals for non-empty search term', () => {
    const result = buildFullTextSearch('john doe');

    expect(result.searchCondition).toBeDefined();
    expect(result.rankLiteral).toBeDefined();
  });

  it('sanitizes invalid column and dictionary inputs', () => {
    const result = buildFullTextSearch('john', {
      searchVectorColumn: 'users.search_vector;DROP TABLE users;',
      dictionary: 'simple;DROP TABLE roles;',
    });

    expect(result.searchCondition).toBeDefined();
    expect(result.rankLiteral).toBeDefined();
  });

  it('builds prefix query terms for multi-word input', () => {
    const result = buildFullTextSearch('user test');

    expect(result.searchCondition).toBeDefined();
    expect(result.rankLiteral).toBeDefined();
  });

  it('returns undefined for input that becomes empty after sanitization', () => {
    const result = buildFullTextSearch('&&& ::: !!!');

    expect(result.searchCondition).toBeUndefined();
    expect(result.rankLiteral).toBeUndefined();
  });
});
