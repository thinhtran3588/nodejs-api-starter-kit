import { literal } from 'sequelize';
import { describe, expect, it } from 'vitest';
import { buildFullTextSearch } from '@app/common/utils/full-text-search';

describe('buildFullTextSearch', () => {
  describe('empty or invalid search terms', () => {
    it('should return undefined values for undefined search term', () => {
      const result = buildFullTextSearch(undefined);

      expect(result.searchCondition).toBeUndefined();
      expect(result.rankLiteral).toBeUndefined();
    });

    it('should return undefined values for null search term', () => {
      const result = buildFullTextSearch(null);

      expect(result.searchCondition).toBeUndefined();
      expect(result.rankLiteral).toBeUndefined();
    });

    it('should return undefined values for empty string', () => {
      const result = buildFullTextSearch('');

      expect(result.searchCondition).toBeUndefined();
      expect(result.rankLiteral).toBeUndefined();
    });

    it('should return undefined values for whitespace-only string', () => {
      const result = buildFullTextSearch('   ');

      expect(result.searchCondition).toBeUndefined();
      expect(result.rankLiteral).toBeUndefined();
    });

    it('should return undefined values for newline-only string', () => {
      const result = buildFullTextSearch('\n\t\r');

      expect(result.searchCondition).toBeUndefined();
      expect(result.rankLiteral).toBeUndefined();
    });
  });

  describe('valid search terms - default config', () => {
    it('should build search condition for simple search term', () => {
      const result = buildFullTextSearch('test');

      expect(result.searchCondition).toBeDefined();
      expect(result.rankLiteral).toBeDefined();

      const condition = result.searchCondition as ReturnType<typeof literal>;
      expect(condition.val).toContain('search_vector');
      expect(condition.val).toContain('plainto_tsquery');
      expect(condition.val).toContain('unaccent_immutable');
      expect(condition.val).toContain('test');
    });

    it('should build search condition for multi-word search term', () => {
      const result = buildFullTextSearch('john doe');

      expect(result.searchCondition).toBeDefined();
      expect(result.rankLiteral).toBeDefined();

      const condition = result.searchCondition as ReturnType<typeof literal>;
      expect(condition.val).toContain('john doe');
    });

    it('should trim whitespace from search term', () => {
      const result = buildFullTextSearch('  test  ');

      expect(result.searchCondition).toBeDefined();
      const condition = result.searchCondition as ReturnType<typeof literal>;
      expect(condition.val).toContain('test');
      expect(condition.val).not.toContain('  test  ');
    });

    it('should build rank literal for relevance sorting', () => {
      const result = buildFullTextSearch('test');

      expect(result.rankLiteral).toBeDefined();

      const rank = result.rankLiteral as ReturnType<typeof literal>;
      expect(rank.val).toContain('ts_rank');
      expect(rank.val).toContain('search_vector');
      expect(rank.val).toContain('plainto_tsquery');
    });
  });

  describe('custom configuration', () => {
    it('should use custom searchVectorColumn', () => {
      const result = buildFullTextSearch('test', {
        searchVectorColumn: 'custom_search_vector',
      });

      expect(result.searchCondition).toBeDefined();
      expect(result.rankLiteral).toBeDefined();
      const condition = result.searchCondition as ReturnType<typeof literal>;
      const rank = result.rankLiteral as ReturnType<typeof literal>;
      expect(condition.val).toContain('custom_search_vector');
      expect(rank.val).toContain('custom_search_vector');
    });

    it('should use custom dictionary', () => {
      const result = buildFullTextSearch('test', {
        dictionary: 'english',
      });

      expect(result.searchCondition).toBeDefined();
      const condition = result.searchCondition as ReturnType<typeof literal>;
      expect(condition.val).toContain("plainto_tsquery('english'");
    });

    it('should use both custom searchVectorColumn and dictionary', () => {
      const result = buildFullTextSearch('test', {
        searchVectorColumn: 'custom_vector',
        dictionary: 'vietnamese',
      });

      expect(result.searchCondition).toBeDefined();
      const condition = result.searchCondition as ReturnType<typeof literal>;
      expect(condition.val).toContain('custom_vector');
      expect(condition.val).toContain("plainto_tsquery('vietnamese'");
    });
  });

  describe('SQL injection prevention', () => {
    it('should escape single quotes in search term', () => {
      const result = buildFullTextSearch("test'value");

      expect(result.searchCondition).toBeDefined();
      const condition = result.searchCondition as ReturnType<typeof literal>;
      expect(condition.val).toContain("test''value");
    });

    it('should escape multiple single quotes', () => {
      const result = buildFullTextSearch("test'value'with'quotes");

      expect(result.searchCondition).toBeDefined();
      const condition = result.searchCondition as ReturnType<typeof literal>;
      expect(condition.val).toContain("test''value''with''quotes");
    });

    it('should handle search term with only single quotes', () => {
      const result = buildFullTextSearch("''");

      expect(result.searchCondition).toBeDefined();
      const condition = result.searchCondition as ReturnType<typeof literal>;
      expect(condition.val).toContain("''''");
    });
  });

  describe('special characters and unicode', () => {
    it('should handle Vietnamese accented characters', () => {
      const result = buildFullTextSearch('tâm tấm tẩm');

      expect(result.searchCondition).toBeDefined();
      const condition = result.searchCondition as ReturnType<typeof literal>;
      expect(condition.val).toContain('tâm tấm tẩm');
      expect(condition.val).toContain('unaccent_immutable');
    });

    it('should handle numbers in search term', () => {
      const result = buildFullTextSearch('test123');

      expect(result.searchCondition).toBeDefined();
      const condition = result.searchCondition as ReturnType<typeof literal>;
      expect(condition.val).toContain('test123');
    });

    it('should handle special characters that plainto_tsquery handles', () => {
      const result = buildFullTextSearch('test@example.com');

      expect(result.searchCondition).toBeDefined();
      const condition = result.searchCondition as ReturnType<typeof literal>;
      expect(condition.val).toContain('test@example.com');
    });
  });

  describe('return value structure', () => {
    it('should return object with searchCondition and rankLiteral properties', () => {
      const result = buildFullTextSearch('test');

      expect(result).toHaveProperty('searchCondition');
      expect(result).toHaveProperty('rankLiteral');
    });

    it('should return Sequelize literal objects for valid search term', () => {
      const result = buildFullTextSearch('test');

      expect(result.searchCondition).toBeInstanceOf(Object);
      expect(result.rankLiteral).toBeInstanceOf(Object);
    });
  });
});
