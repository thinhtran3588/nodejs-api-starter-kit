import type { Command } from '@app/common';

export interface AddUserToUserGroupCommand extends Command {
  readonly userGroupId: string;
  readonly userId: string;
}
