import type { DomainEvent } from '@app/common/domain/domain-event';
import type { EventHandler } from '@app/common/domain/interfaces/event-handler';
import { UserEventType } from '@app/modules/auth/domain/enums/user-event-type';

/**
 * Event handler for USER_REGISTERED events
 *
 * Example handler that processes user registration events.
 * This can be extended to send welcome emails, update analytics, etc.
 */
export class UserRegisteredHandler implements EventHandler {
  readonly eventTypes = [UserEventType.REGISTERED];

  async handle(event: DomainEvent): Promise<void> {
    const userId = event.aggregateId.getValue();
    const email = event.data['email'] as string;
    const username = event.data['username'] as string | undefined;

    // sleep for 1 seconds
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // eslint-disable-next-line no-console
    console.log(
      `User registered: ${userId}, email: ${email}, username: ${username}`
    );

    // Future: Send welcome email
    // Future: Update analytics
    // Future: Trigger onboarding workflow

    return Promise.resolve();
  }
}
