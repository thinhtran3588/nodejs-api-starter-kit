import type { Uuid } from '@app/common/domain/value-objects/uuid';
import type { Email } from '@app/modules/auth/domain/value-objects/email';

/**
 * Service interface for generating user IDs
 * Encapsulates the business rule for user ID generation
 */
export interface UserIdGeneratorService {
  /**
   * Generate a user ID based on email
   * Business rule: User ID is generated using uuidv5 with email and app code
   */
  generateUserId(email: Email): Uuid;
}
