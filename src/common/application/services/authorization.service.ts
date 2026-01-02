import { AuthorizationExceptionCode } from '@app/common/enums/authorization-exception-code';
import type { AppContext } from '@app/common/interfaces/context';
import { BusinessException } from '@app/common/utils/exceptions';

export const ADMIN_ROLE = 'ADMIN';

/**
 * Authorization service in Application Layer
 * This is reusable across ALL modules (auth, asset-tracker, etc.)
 * and ALL interfaces (HTTP, GraphQL, gRPC, CLI, etc.)
 */
export class AuthorizationService {
  /**
   * Ensures user is authenticated
   * @throws BusinessException if user is not authenticated
   */
  requireAuthenticated(
    context: AppContext
  ): asserts context is { user: NonNullable<AppContext['user']> } {
    if (!context.user?.userId) {
      throw new BusinessException(
        AuthorizationExceptionCode.UNAUTHORIZED,
        undefined,
        'Authentication required'
      );
    }
  }

  /**
   * Ensures user has one of the required roles
   * @throws BusinessException if user doesn't have required role
   */
  requireRole(requiredRole: string, context: AppContext): void {
    this.requireAuthenticated(context);

    if (this.hasAdminRole(context)) {
      return;
    }

    const userRoles = context.user.roles ?? [];
    if (!userRoles.includes(requiredRole)) {
      throw new BusinessException(
        AuthorizationExceptionCode.FORBIDDEN,
        {
          requiredRole,
        },
        `Required role: ${requiredRole}`
      );
    }
  }

  /**
   * Ensures user has at least one of the required roles
   * @throws BusinessException if user doesn't have any of the required roles
   */
  requireOneOfRoles(
    requiredRoles: readonly string[],
    context: AppContext
  ): void {
    this.requireAuthenticated(context);

    if (this.hasAdminRole(context)) {
      return;
    }

    const userRoles = context.user.roles ?? [];
    const hasRequiredRole = requiredRoles.some((role) =>
      userRoles.includes(role)
    );

    if (!hasRequiredRole) {
      throw new BusinessException(
        AuthorizationExceptionCode.FORBIDDEN,
        {
          requiredRoles: [...requiredRoles],
        },
        `Required one of roles: ${requiredRoles.join(' or ')}`
      );
    }
  }

  hasAdminRole(context: AppContext): boolean {
    return context.user?.roles?.includes(ADMIN_ROLE) ?? false;
  }
}
