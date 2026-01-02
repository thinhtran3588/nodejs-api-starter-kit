import type { Command } from '@app/common/interfaces/command';

export interface UpdateUserGroupCommand extends Command {
  readonly id: string;
  readonly name?: string;
  readonly description?: string;
}
