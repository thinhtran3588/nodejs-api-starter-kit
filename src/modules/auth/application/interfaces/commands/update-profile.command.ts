import type { Command } from '@app/common/interfaces/command';

export interface UpdateProfileCommand extends Command {
  readonly displayName?: string;
  readonly username?: string;
}
