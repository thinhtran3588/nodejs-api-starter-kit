import type { Command } from '@app/common/interfaces/command';

export interface ToggleUserStatusCommand extends Command {
  readonly id: string;
  readonly enabled: boolean;
}
