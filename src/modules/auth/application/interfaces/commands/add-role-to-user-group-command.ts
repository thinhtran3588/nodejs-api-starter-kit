import type { Command } from '@app/common';

export interface AddRoleToUserGroupCommand extends Command {
  readonly userGroupId: string;
  readonly roleId: string;
}
