import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { UserGateway } from '../../gateways/user-gateway';
import type { SessionGateway } from '../../gateways/session-gateway';
import type { ListUsersOutput } from '../../dtos/users';

export class ListUsersUseCase {
  private users: UserGateway;
  private session: SessionGateway;

  public constructor(users: UserGateway, session: SessionGateway) {
    this.users = users;
    this.session = session;
  }

  public execute(): Promise<ListUsersOutput> {
    const currentSession = this.session.get();
    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    const usersRequest = this.users.users(token);
    return usersRequest;
  }
}
