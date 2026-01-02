const CONFIG = {
  cors: {
    enabled: process.env['WEB_CORS_ENABLED'] === 'true',
    origins: process.env['WEB_CORS_ORIGINS']?.split(',') ?? [],
  },
  rateLimit: {
    max:
      process.env['WEB_RATE_LIMIT_MAX'] &&
      !Number.isNaN(Number(process.env['WEB_RATE_LIMIT_MAX']))
        ? Number(process.env['WEB_RATE_LIMIT_MAX'])
        : 1000,
    timeWindow: process.env['WEB_RATE_LIMIT_TIME_WINDOW'] ?? '1 minute',
  },
} as const;

/**
 * Web configuration
 */
export function webConfig() {
  return CONFIG;
}
