import type { Command } from '@app/common/interfaces/command';

export interface RemoveRoleFromUserGroupCommand extends Command {
  readonly userGroupId: string;
  readonly roleId: string;
}
