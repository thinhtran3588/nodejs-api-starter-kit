import type { Command } from '@app/common';

export interface RemoveUserFromUserGroupCommand extends Command {
  readonly userGroupId: string;
  readonly userId: string;
}
