import type { DomainEvent } from '../domain-event';

/**
 * EventHandler - Interface for handling domain events
 *
 * Event handlers subscribe to specific event types and process them
 * when events are dispatched.
 *
 * Handlers subscribe to one or more event types using `eventTypes` array.
 * The handler will be registered for all event types in the array.
 */
export interface EventHandler {
  /**
   * The event types this handler subscribes to
   * The handler will be registered for all event types in this array.
   */
  readonly eventTypes: string[];

  /**
   * Handles a domain event
   * @param event - The domain event to handle
   */
  handle(event: DomainEvent): Promise<void>;
}
