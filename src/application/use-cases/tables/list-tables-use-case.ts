import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { TableGateway } from '../../gateways/table-gateway';
import type { SessionGateway } from '../../gateways/session-gateway';
import type { ListTablesOutput } from '../../dtos/tables';

export class ListTablesUseCase {
  private tables: TableGateway;
  private session: SessionGateway;

  public constructor(tables: TableGateway, session: SessionGateway) {
    this.tables = tables;
    this.session = session;
  }

  public execute(): Promise<ListTablesOutput> {
    const currentSession = this.session.get();
    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    const tablesRequest = this.tables.tables(token);
    return tablesRequest;
  }
}
