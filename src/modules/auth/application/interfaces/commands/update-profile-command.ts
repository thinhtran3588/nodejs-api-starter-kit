import type { Command } from '@app/common';

export interface UpdateProfileCommand extends Command {
  readonly displayName?: string;
  readonly username?: string;
}
