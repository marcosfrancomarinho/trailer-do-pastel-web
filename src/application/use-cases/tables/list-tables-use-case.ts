import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { TableGateway } from '../../gateways/table-gateway';
import type { SessionGateway } from '../../gateways/session-gateway';

export class ListTablesUseCase {
  private tables: TableGateway;
  private session: SessionGateway;

  public constructor(tables: TableGateway, session: SessionGateway) {
    this.tables = tables;
    this.session = session;
  }

  public execute() {
    const currentSession = this.session.get();
    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    return this.tables.tables(token);
  }
}
