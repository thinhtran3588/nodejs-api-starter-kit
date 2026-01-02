import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { webConfig } from '@app/application/config/web.config';

/**
 * Registers the rate limiting plugin with the Fastify instance
 * @param app - The Fastify instance to register the middleware with
 * @returns void
 */
export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  const {
    rateLimit: { max, timeWindow },
  } = webConfig();

  await app.register(rateLimit, {
    max,
    timeWindow,
    // Use IP address as the key for rate limiting
    keyGenerator: (request) => {
      // Try to get IP from various headers (for proxies/load balancers)
      return (
        (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
        (request.headers['x-real-ip'] as string) ??
        request.ip ??
        request.socket.remoteAddress ??
        'unknown'
      );
    },
    // Add rate limit headers to response
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
  });
}
