import type { Command } from '@app/common/interfaces/command';

export interface AddRoleToUserGroupCommand extends Command {
  readonly userGroupId: string;
  readonly roleId: string;
}
