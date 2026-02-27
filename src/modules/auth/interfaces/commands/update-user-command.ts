import type { Command } from '@app/common';

export interface UpdateUserCommand extends Command {
  readonly id: string;
  readonly displayName?: string;
  readonly username?: string;
}
