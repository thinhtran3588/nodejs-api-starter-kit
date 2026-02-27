import { v5 as uuidv5 } from 'uuid';
import { Uuid } from '@app/common';
import type { Email, UserIdGeneratorService } from '@app/modules/auth/domain';

const APP_CODE = process.env['APP_CODE'] ?? 'app';
/**
 * Infrastructure implementation of UserIdGeneratorService
 * Generates user IDs using uuidv5 with email and app code
 */
export class UserIdGeneratorServiceImpl implements UserIdGeneratorService {
  generateUserId(email: Email): Uuid {
    const namespace = uuidv5(APP_CODE, uuidv5.DNS);
    const uuidString = uuidv5(email.getValue(), namespace);
    return Uuid.create(uuidString, 'userId');
  }
}
