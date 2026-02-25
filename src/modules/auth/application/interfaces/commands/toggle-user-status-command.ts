import type { Command } from '@app/common';

export interface ToggleUserStatusCommand extends Command {
  readonly id: string;
  readonly enabled: boolean;
}
