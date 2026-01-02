import { Uuid } from '@app/common/domain/value-objects/uuid';

/**
 * App user context passed from interface layer to application layer
 * This is interface-agnostic - any interface can create this
 *
 * Contains all context information needed for use cases
 */
export interface AppUser {
  userId: Uuid;
  roles?: string[];
}

/**
 * Application context passed from interface layer to application layer
 * This is interface-agnostic - any interface can create this
 *
 * Contains all context information needed for use cases
 */
export interface AppContext {
  user?: AppUser;
}
