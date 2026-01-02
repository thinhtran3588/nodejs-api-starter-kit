import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('load-env', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('should load environment config when module is imported', async () => {
    const loadEnvConfigMock = vi.fn();
    vi.doMock('@app/common/utils/load-env-config', () => ({
      loadEnvConfig: loadEnvConfigMock,
    }));

    await import('@app/common/utils/load-env');

    expect(loadEnvConfigMock).toHaveBeenCalled();
  });
});
