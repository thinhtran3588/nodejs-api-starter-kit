import type { Command } from '@app/common';

export interface RemoveRoleFromUserGroupCommand extends Command {
  readonly userGroupId: string;
  readonly roleId: string;
}
