import type { Command } from '@app/common/interfaces/command';

export interface CreateUserGroupCommand extends Command {
  readonly name: string;
  readonly description?: string;
}
