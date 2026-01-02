import type { Command } from '@app/common/interfaces/command';

export interface RemoveUserFromUserGroupCommand extends Command {
  readonly userGroupId: string;
  readonly userId: string;
}
