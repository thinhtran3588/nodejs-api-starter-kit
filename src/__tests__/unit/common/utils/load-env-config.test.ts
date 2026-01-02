import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('loadEnvConfig', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalCwd: typeof process.cwd;

  beforeEach(() => {
    originalEnv = { ...process.env };
    originalCwd = process.cwd;
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    process.cwd = originalCwd;
    vi.restoreAllMocks();
  });

  describe('happy path', () => {
    it('should load base .env file', async () => {
      const configSpy = vi.fn();
      vi.doMock('dotenv', () => ({
        config: configSpy,
      }));

      const { loadEnvConfig } = await import(
        '@app/common/utils/load-env-config'
      );

      loadEnvConfig();

      expect(configSpy).toHaveBeenCalledTimes(2);
      expect(configSpy).toHaveBeenNthCalledWith(1, {
        path: expect.stringContaining('.env'),
      });
    });

    it('should load environment-specific file based on NODE_ENV', async () => {
      process.env['NODE_ENV'] = 'test';
      const configSpy = vi.fn();
      vi.doMock('dotenv', () => ({
        config: configSpy,
      }));

      const { loadEnvConfig } = await import(
        '@app/common/utils/load-env-config'
      );

      loadEnvConfig();

      expect(configSpy).toHaveBeenCalledTimes(2);
      expect(configSpy).toHaveBeenNthCalledWith(2, {
        path: expect.stringContaining('.env.test'),
        override: true,
      });
    });

    it('should use development as default when NODE_ENV is not set', async () => {
      delete process.env['NODE_ENV'];
      const configSpy = vi.fn();
      vi.doMock('dotenv', () => ({
        config: configSpy,
      }));

      const { loadEnvConfig } = await import(
        '@app/common/utils/load-env-config'
      );

      loadEnvConfig();

      expect(configSpy).toHaveBeenCalledTimes(2);
      expect(configSpy).toHaveBeenNthCalledWith(2, {
        path: expect.stringContaining('.env.development'),
        override: true,
      });
    });

    it('should load base .env before environment-specific file', async () => {
      const configSpy = vi.fn();
      vi.doMock('dotenv', () => ({
        config: configSpy,
      }));

      const { loadEnvConfig } = await import(
        '@app/common/utils/load-env-config'
      );

      loadEnvConfig();

      expect(configSpy).toHaveBeenCalledTimes(2);
      const firstCall = configSpy.mock.calls[0]?.[0];
      const secondCall = configSpy.mock.calls[1]?.[0];

      expect(firstCall?.path).toContain('.env');
      expect(secondCall?.path).toContain('.env.');
      expect(secondCall?.override).toBe(true);
    });
  });

  describe('environment-specific loading', () => {
    it('should load .env.production when NODE_ENV is production', async () => {
      process.env['NODE_ENV'] = 'production';
      const configSpy = vi.fn();
      vi.doMock('dotenv', () => ({
        config: configSpy,
      }));

      const { loadEnvConfig } = await import(
        '@app/common/utils/load-env-config'
      );

      loadEnvConfig();

      expect(configSpy).toHaveBeenNthCalledWith(2, {
        path: expect.stringContaining('.env.production'),
        override: true,
      });
    });

    it('should load .env.staging when NODE_ENV is staging', async () => {
      process.env['NODE_ENV'] = 'staging';
      const configSpy = vi.fn();
      vi.doMock('dotenv', () => ({
        config: configSpy,
      }));

      const { loadEnvConfig } = await import(
        '@app/common/utils/load-env-config'
      );

      loadEnvConfig();

      expect(configSpy).toHaveBeenNthCalledWith(2, {
        path: expect.stringContaining('.env.staging'),
        override: true,
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty NODE_ENV string', async () => {
      process.env['NODE_ENV'] = '';
      const configSpy = vi.fn();
      vi.doMock('dotenv', () => ({
        config: configSpy,
      }));

      const { loadEnvConfig } = await import(
        '@app/common/utils/load-env-config'
      );

      loadEnvConfig();

      expect(configSpy).toHaveBeenNthCalledWith(2, {
        path: expect.stringContaining('.env.'),
        override: true,
      });
    });

    it('should resolve paths correctly using process.cwd()', async () => {
      const mockCwd = vi.fn(() => '/mock/project/root');
      process.cwd = mockCwd;
      const configSpy = vi.fn();
      vi.doMock('dotenv', () => ({
        config: configSpy,
      }));

      const { loadEnvConfig } = await import(
        '@app/common/utils/load-env-config'
      );

      loadEnvConfig();

      expect(mockCwd).toHaveBeenCalled();
      expect(configSpy).toHaveBeenCalled();
    });
  });
});
