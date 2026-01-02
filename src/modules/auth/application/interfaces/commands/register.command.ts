import type { Command } from '@app/common/interfaces/command';

export interface RegisterCommand extends Command {
  readonly email: string;
  readonly password: string;
  readonly displayName?: string;
  readonly username?: string;
}

export interface RegisterResult {
  id: string;
  idToken: string;
  signInToken: string;
}
