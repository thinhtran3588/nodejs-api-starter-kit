import type { App, Context } from '@app/common';

const LOCAL_IP_FALLBACK = '127.0.0.1';

function getClientIpFromForwardedFor(
  forwardedFor: string | undefined
): string | undefined {
  if (!forwardedFor) {
    return undefined;
  }

  const firstHop = forwardedFor
    .split(',')
    .map((value) => value.trim())
    .find(Boolean);

  return firstHop;
}

export const registerIpExtractor = (app: App) => {
  app.use('*', async (c: Context, next) => {
    // Cloudflare: prefer True-Client-IP when enabled, then CF-Connecting-IP.
    // AWS ALB / API Gateway: use the first IP from X-Forwarded-For.
    const ip =
      c.req.header('true-client-ip') ??
      c.req.header('cf-connecting-ip') ??
      getClientIpFromForwardedFor(c.req.header('x-forwarded-for')) ??
      LOCAL_IP_FALLBACK;

    c.set('ip', ip);
    await next();
  });
};
