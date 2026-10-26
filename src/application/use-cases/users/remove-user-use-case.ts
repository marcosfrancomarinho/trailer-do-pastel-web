import { RemoveUser } from '../../validation/users/remove-user.ts';
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { UserGateway } from '../../gateways/user-gateway';
import type { RemoveUserInput } from '../../dtos/users';
import type { SessionGateway } from '../../gateways/session-gateway';

export class RemoveUserUseCase {
  private users: UserGateway;
  private session: SessionGateway;

  public constructor(users: UserGateway, session: SessionGateway) {
    this.users = users;
    this.session = session;
  }

  public execute(input: RemoveUserInput): Promise<void> {
    const validatedInput = RemoveUser.validate(input);
    const currentSession = this.session.get();
    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    const removeUserRequest = this.users.removeUser(token, validatedInput.userId);
    return removeUserRequest;
  }
}
