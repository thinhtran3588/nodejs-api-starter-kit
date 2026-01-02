import type { DomainEvent } from '@app/common/domain/domain-event';
import type { EventDispatcher as IEventDispatcher } from '@app/common/domain/interfaces/event-dispatcher';
import type { EventHandler } from '@app/common/domain/interfaces/event-handler';
import type { Logger } from '@app/common/domain/interfaces/logger';

/**
 * EventDispatcher implementation
 *
 * Manages event handler registration and dispatches events to subscribed handlers.
 * Handlers are executed asynchronously and errors are logged but don't affect other handlers.
 * The dispatch method returns immediately without waiting for handlers to complete.
 */
export class EventDispatcher implements IEventDispatcher {
  private readonly handlers = new Map<string, EventHandler[]>();

  constructor(private readonly logger: Logger) {}

  registerHandler(handler: EventHandler): void {
    // Validate handler configuration
    if (!handler.eventTypes || handler.eventTypes.length === 0) {
      throw new Error(
        'EventHandler must provide eventTypes array with at least one event type'
      );
    }

    // Register handler for all its event types
    for (const eventType of handler.eventTypes) {
      const handlersForType = this.handlers.get(eventType) ?? [];
      handlersForType.push(handler);
      this.handlers.set(eventType, handlersForType);
    }
  }

  dispatch(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return Promise.resolve();
    }

    // Fire off handlers asynchronously without waiting for them
    setImmediate(() => {
      for (const event of events) {
        const handlersForType = this.handlers.get(event.eventType) ?? [];

        for (const handler of handlersForType) {
          // Don't await - fire and forget
          handler.handle(event).catch((error) => {
            this.logger.error(
              {
                eventType: event.eventType,
                aggregateId: event.aggregateId.getValue(),
                aggregateName: event.aggregateName,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
              },
              `Event handler failed for event type ${event.eventType}`
            );
          });
        }
      }
    });

    // Return immediately without waiting for handlers
    return Promise.resolve();
  }
}
