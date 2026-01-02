import type { DomainEvent } from '../domain-event';
import type { EventHandler } from './event-handler';

/**
 * EventDispatcher - Interface for dispatching domain events to handlers
 *
 * Manages event handler registration and dispatches events to subscribed handlers.
 */
export interface EventDispatcher {
  /**
   * Registers an event handler for one or more event types
   * The handler will be registered for all event types in its `eventTypes` array
   * @param handler - The event handler to register
   */
  registerHandler(handler: EventHandler): void;

  /**
   * Dispatches domain events to registered handlers asynchronously
   * Returns immediately without waiting for handlers to complete.
   * @param events - Array of domain events to dispatch
   */
  dispatch(events: DomainEvent[]): Promise<void>;
}
