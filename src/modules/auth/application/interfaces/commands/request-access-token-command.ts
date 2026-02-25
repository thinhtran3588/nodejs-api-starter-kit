import type { Command } from '@app/common';

export interface RequestAccessTokenCommand extends Command {
  readonly idToken: string;
}

export interface RequestAccessTokenResult {
  token: string;
}
