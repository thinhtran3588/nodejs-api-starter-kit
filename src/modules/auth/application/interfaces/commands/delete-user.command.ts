import type { Command } from '@app/common/interfaces/command';

export interface DeleteUserCommand extends Command {
  readonly id: string;
}
