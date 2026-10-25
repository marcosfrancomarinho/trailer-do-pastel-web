import { CreateUser } from '../../validation/users/create-user.ts';
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { UserGateway } from '../../gateways/user-gateway';
import type { CreateUserInput } from '../../dtos/users';
import type { SessionGateway } from '../../gateways/session-gateway';

export class CreateUserUseCase {
  private users: UserGateway;
  private session: SessionGateway;

  public constructor(users: UserGateway, session: SessionGateway) {
    this.users = users;
    this.session = session;
  }

  public execute(input: CreateUserInput) {
    const validatedInput = CreateUser.validate(input);
    const currentSession = this.session.get();
    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    const user = { name: validatedInput.name, password: validatedInput.password };
    return this.users.createUser(token, user);
  }
}
