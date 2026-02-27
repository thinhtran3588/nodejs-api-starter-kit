import { asValue } from 'awilix';
import type { Container } from '@app/application/container';
import { Uuid, type App, type AppUser, type Context } from '@app/common';

export function extractBearerToken(
  authorizationHeader: string | undefined
): string | undefined {
  if (!authorizationHeader) {
    return undefined;
  }

  const trimmed = authorizationHeader.trim();
  const bearerPrefix = 'Bearer ';
  if (
    trimmed.length <= bearerPrefix.length ||
    !trimmed.slice(0, bearerPrefix.length).toLowerCase().startsWith('bearer ')
  ) {
    return undefined;
  }

  const token = trimmed.slice(bearerPrefix.length).trim();
  return token || undefined;
}

export function extractUserContext(c: Context<Container>): AppUser | undefined {
  try {
    const token = extractBearerToken(c.req.header('authorization'));
    if (!token) {
      return undefined;
    }

    const { jwtService } = c.var.container.cradle;
    const { userId, roles } = jwtService.verifyToken(token);

    if (!userId) {
      return undefined;
    }

    const userIdResult = Uuid.tryCreate(userId, 'userId');
    if (userIdResult.error || !userIdResult.uuid) {
      return undefined;
    }

    return {
      userId: userIdResult.uuid,
      roles,
    };
  } catch {
    return undefined;
  }
}

export const registerAttachUser = (app: App<Container>) => {
  app.use('*', async (c: Context<Container>, next) => {
    const userContext = extractUserContext(c);

    if (userContext) {
      c.set('user', userContext);
      // Enrich the request-scoped logger with authenticated userId for downstream logs.
      const userId = userContext.userId.getValue();
      const userLogger = c.var.container.cradle.logger.child({ userId });
      c.var.container.register({
        logger: asValue(userLogger),
      });
    }

    await next();
  });
};
