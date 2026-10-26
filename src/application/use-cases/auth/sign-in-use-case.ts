import { SignIn } from '../../validation/auth/sign-in.ts';
import type { AuthGateway } from '../../gateways/auth-gateway';
import type { SessionGateway } from '../../gateways/session-gateway';
import type { SignInInput, SignInOutput } from '../../dtos/auth';

export class SignInUseCase {
  private auth: AuthGateway;
  private session: SessionGateway;

  public constructor(auth: AuthGateway, session: SessionGateway) {
    this.auth = auth;
    this.session = session;
  }

  public async execute(input: SignInInput): Promise<SignInOutput> {
    const validatedInput = SignIn.validate(input);
    const authenticated = await this.auth.signIn(validatedInput.name, validatedInput.password);
    this.session.save(authenticated);
    return authenticated;
  }
}
