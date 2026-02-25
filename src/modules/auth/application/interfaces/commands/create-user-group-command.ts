import type { Command } from '@app/common';

export interface CreateUserGroupCommand extends Command {
  readonly name: string;
  readonly description?: string;
}
