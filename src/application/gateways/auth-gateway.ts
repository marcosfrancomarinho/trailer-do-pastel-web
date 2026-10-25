import type { SignInOutput } from '../dtos/auth';

export interface AuthGateway {
  signIn(name: string, password: string): Promise<SignInOutput>;
}
