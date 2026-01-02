import type { Command } from '@app/common/interfaces/command';

export interface DeleteUserGroupCommand extends Command {
  readonly id: string;
}
