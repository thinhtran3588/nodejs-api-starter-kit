import type { FastifyReply, FastifyRequest } from 'fastify';
import { Uuid } from '@app/common/domain/value-objects/uuid';
import type { JwtService } from '@app/common/infrastructure/services/jwt.service';
import type { AppContext, AppUser } from '@app/common/interfaces/context';

/**
 * Extracts the Bearer token from the authorization header
 * Handles various formats: "Bearer token", "bearer token", "Bearer  token" (with extra spaces)
 *
 * @param authorizationHeader - The authorization header value
 * @returns The token if valid Bearer format, undefined otherwise
 */
export function extractBearerToken(
  authorizationHeader: string | undefined
): string | undefined {
  if (!authorizationHeader) {
    return undefined;
  }

  // Trim whitespace
  const trimmed = authorizationHeader.trim();

  // Check if it starts with "Bearer " (case-insensitive)
  const bearerPrefix = 'Bearer ';
  if (
    trimmed.length <= bearerPrefix.length ||
    !trimmed.slice(0, bearerPrefix.length).toLowerCase().startsWith('bearer ')
  ) {
    return undefined;
  }

  // Extract token after "Bearer " prefix
  const token = trimmed.slice(bearerPrefix.length).trim();

  return token;
}

/**
 * Extracts user context from JWT Bearer token
 * Fastify-specific: Extract user context from JWT access token
 * This is the ONLY interface-specific part
 * The AppUser object is interface-agnostic
 *
 * @param request - Fastify request object
 * @returns UserContext if token is valid, undefined otherwise
 */
export function extractUserContext(
  request: FastifyRequest
): AppUser | undefined {
  try {
    const { authorization: authorizationHeader } = request.headers;

    // Extract Bearer token from authorization header
    const token = extractBearerToken(authorizationHeader);
    if (!token) {
      return undefined;
    }

    // Get JWT service from dependency injection container
    const jwtService =
      request.server.diContainer.resolve<JwtService>('jwtService');

    // Verify the JWT access token
    const { userId, roles } = jwtService.verifyToken(token);

    if (!userId) {
      return undefined;
    }

    // Create Uuid value object from string
    const userIdResult = Uuid.tryCreate(userId, 'userId');
    if (userIdResult.error) {
      return undefined;
    }

    return {
      userId: userIdResult.uuid!,
      roles,
    };
  } catch {
    // Return undefined for all error cases to indicate unauthenticated user
    return undefined;
  }
}

/**
 * Fastify middleware hook: Attach application context to request
 * This hook extracts the user context from the Bearer token and creates an AppContext
 * The appContext will be available in all route handlers via request.appContext
 */
export async function attachAppContext(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const userContext = extractUserContext(request);
  // Attach to request for use in controllers
  // TypeScript types are extended in src/application/types/fastify.d.ts
  (request as FastifyRequest & { appContext: AppContext }).appContext = {
    user: userContext,
  };
  await Promise.resolve();
}
