import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { UserGateway } from '../../gateways/user-gateway';
import type { SessionGateway } from '../../gateways/session-gateway';

export class ListUsersUseCase {
  private users: UserGateway;
  private session: SessionGateway;

  public constructor(users: UserGateway, session: SessionGateway) {
    this.users = users;
    this.session = session;
  }

  public execute() {
    const currentSession = this.session.get();
    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    return this.users.users(token);
  }
}
