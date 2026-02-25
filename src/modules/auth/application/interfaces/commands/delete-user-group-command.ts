import type { Command } from '@app/common';

export interface DeleteUserGroupCommand extends Command {
  readonly id: string;
}
