import { resolve } from 'node:path';
import { config } from 'dotenv';

/**
 * Loads environment variables based on NODE_ENV value
 * - .env is always loaded first (base configuration)
 * - .env.{NODE_ENV} is loaded dynamically based on NODE_ENV value
 * Environment-specific files override values from .env
 */
export function loadEnvConfig(): void {
  const projectRoot = resolve(process.cwd());

  // Always load base .env first
  config({ path: resolve(projectRoot, '.env') });

  // Load environment-specific file based on NODE_ENV
  const nodeEnv = process.env['NODE_ENV'] ?? 'development';
  const envFile = `.env.${nodeEnv}`;

  config({ path: resolve(projectRoot, envFile), override: true });
}
