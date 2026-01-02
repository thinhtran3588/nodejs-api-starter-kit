import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('constants', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  describe('PAGINATION_DEFAULT_ITEMS_PER_PAGE', () => {
    it('should use default value of 50 when env var is not set', async () => {
      delete process.env['PAGINATION_DEFAULT_ITEMS_PER_PAGE'];
      vi.resetModules();
      const { PAGINATION_DEFAULT_ITEMS_PER_PAGE: value } = await import(
        '@app/common/constants'
      );
      expect(value).toBe(50);
    });

    it('should use value from environment variable when set', async () => {
      process.env['PAGINATION_DEFAULT_ITEMS_PER_PAGE'] = '25';
      vi.resetModules();
      const { PAGINATION_DEFAULT_ITEMS_PER_PAGE: value } = await import(
        '@app/common/constants'
      );
      expect(value).toBe(25);
    });

    it('should use default value when env var is invalid number', async () => {
      process.env['PAGINATION_DEFAULT_ITEMS_PER_PAGE'] = 'invalid';
      vi.resetModules();
      const { PAGINATION_DEFAULT_ITEMS_PER_PAGE: value } = await import(
        '@app/common/constants'
      );
      expect(value).toBe(50);
    });
  });

  describe('PAGINATION_MAX_ITEMS_PER_PAGE', () => {
    it('should use default value of 100 when env var is not set', async () => {
      delete process.env['PAGINATION_MAX_ITEMS_PER_PAGE'];
      vi.resetModules();
      const { PAGINATION_MAX_ITEMS_PER_PAGE: value } = await import(
        '@app/common/constants'
      );
      expect(value).toBe(100);
    });

    it('should use value from environment variable when set', async () => {
      process.env['PAGINATION_MAX_ITEMS_PER_PAGE'] = '200';
      vi.resetModules();
      const { PAGINATION_MAX_ITEMS_PER_PAGE: value } = await import(
        '@app/common/constants'
      );
      expect(value).toBe(200);
    });

    it('should use default value when env var is invalid number', async () => {
      process.env['PAGINATION_MAX_ITEMS_PER_PAGE'] = 'invalid';
      vi.resetModules();
      const { PAGINATION_MAX_ITEMS_PER_PAGE: value } = await import(
        '@app/common/constants'
      );
      expect(value).toBe(100);
    });
  });

  describe('SEARCH_TERM_MAX_LENGTH', () => {
    it('should use default value of 50 when env var is not set', async () => {
      delete process.env['SEARCH_TERM_MAX_LENGTH'];
      vi.resetModules();
      const { SEARCH_TERM_MAX_LENGTH: value } = await import(
        '@app/common/constants'
      );
      expect(value).toBe(50);
    });

    it('should use value from environment variable when set', async () => {
      process.env['SEARCH_TERM_MAX_LENGTH'] = '75';
      vi.resetModules();
      const { SEARCH_TERM_MAX_LENGTH: value } = await import(
        '@app/common/constants'
      );
      expect(value).toBe(75);
    });

    it('should use default value when env var is invalid number', async () => {
      process.env['SEARCH_TERM_MAX_LENGTH'] = 'invalid';
      vi.resetModules();
      const { SEARCH_TERM_MAX_LENGTH: value } = await import(
        '@app/common/constants'
      );
      expect(value).toBe(50);
    });
  });

  describe('TEXT_MAX_LENGTH', () => {
    it('should be 255', async () => {
      vi.resetModules();
      const { TEXT_MAX_LENGTH } = await import('@app/common/constants');
      expect(TEXT_MAX_LENGTH).toBe(255);
    });
  });

  describe('TEXT_DESCRIPTION_MAX_LENGTH', () => {
    it('should be 1000', async () => {
      vi.resetModules();
      const { TEXT_DESCRIPTION_MAX_LENGTH } = await import(
        '@app/common/constants'
      );
      expect(TEXT_DESCRIPTION_MAX_LENGTH).toBe(1000);
    });
  });
});
