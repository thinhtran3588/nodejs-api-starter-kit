import type { Command } from '@app/common/interfaces/command';

export interface SignInCommand extends Command {
  readonly emailOrUsername: string;
  readonly password: string;
}

export interface SignInResult {
  id: string;
  idToken: string;
  signInToken: string;
}
