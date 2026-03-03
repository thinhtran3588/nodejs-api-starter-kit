import type { SQL } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { buildFullTextSearch } from '@app/common';

function toSql(sqlLiteral: SQL | undefined): string {
  if (!sqlLiteral) {
    throw new Error('Expected SQL literal to be defined');
  }

  return JSON.stringify(sqlLiteral.queryChunks);
}

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

  it('uses full-text query only for single-term input', () => {
    const result = buildFullTextSearch('xyz');
    const searchSql = toSql(result.searchCondition);

    expect(searchSql).toContain('to_tsquery');
    expect(searchSql).not.toContain('ILIKE');
  });

  it('uses full-text query only for multi-word input', () => {
    const result = buildFullTextSearch('abc xyz');
    const searchSql = toSql(result.searchCondition);

    expect(searchSql).toContain('to_tsquery');
    expect(searchSql).not.toContain('ILIKE');
  });

  it('returns undefined for input that becomes empty after sanitization', () => {
    const result = buildFullTextSearch('&&& ::: !!!');

    expect(result.searchCondition).toBeUndefined();
    expect(result.rankLiteral).toBeUndefined();
  });

  it('sanitizes punctuation-heavy terms without throwing', () => {
    const result = buildFullTextSearch("O'Reilly !!! @@ TypeScript");
    const searchSql = toSql(result.searchCondition);

    expect(searchSql).toContain('to_tsquery');
    expect(result.rankLiteral).toBeDefined();
  });

  it('deduplicates terms and caps total terms to keep query bounded', () => {
    const result = buildFullTextSearch(
      'john john john a b c d e f g h i j k l'
    );
    const searchSql = toSql(result.searchCondition);

    expect(searchSql).toContain('john:*');
    expect(searchSql.match(/:\*/g)?.length).toBeLessThanOrEqual(8);
  });
});
