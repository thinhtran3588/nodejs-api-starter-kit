import type { Command } from '@app/common/interfaces/command';

export interface AddUserToUserGroupCommand extends Command {
  readonly userGroupId: string;
  readonly userId: string;
}
