import type { Command } from '@app/common';

export interface DeleteUserCommand extends Command {
  readonly id: string;
}
