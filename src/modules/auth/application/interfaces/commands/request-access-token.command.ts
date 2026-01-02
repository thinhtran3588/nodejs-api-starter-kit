import type { Command } from '@app/common/interfaces/command';

export interface RequestAccessTokenCommand extends Command {
  readonly idToken: string;
}

export interface RequestAccessTokenResult {
  token: string;
}
