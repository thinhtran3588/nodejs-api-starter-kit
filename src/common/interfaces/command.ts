import type { AppContext } from '@app/common/interfaces/context';

/**
 * Base interface for all commands (write operations)
 * Commands represent intent to change system state
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Command {}

/**
 * Result interface for create commands
 * Contains the ID of the newly created entity
 */
export interface CreateCommandResult {
  id: string;
}

/**
 * Command handler interface
 * Handles execution of a specific command type
 * @template TCommand - The command type
 * @template TResult - The return type of the command handler
 */
export interface CommandHandler<TCommand extends Command, TResult = void> {
  execute(command: TCommand, context?: AppContext): Promise<TResult>;
}
