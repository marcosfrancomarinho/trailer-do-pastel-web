import { ListTableSessions } from '../../validation/tables/list-table-sessions.ts';
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { TableGateway } from '../../gateways/table-gateway';
import type { TableIdInput, ListTableSessionsOutput } from '../../dtos/tables';
import type { SessionGateway } from '../../gateways/session-gateway';

export class ListTableSessionsUseCase {
  private tables: TableGateway;
  private session: SessionGateway;

  public constructor(tables: TableGateway, session: SessionGateway) {
    this.tables = tables;
    this.session = session;
  }

  public execute(input: TableIdInput): Promise<ListTableSessionsOutput> {
    const validatedInput = ListTableSessions.validate(input);
    const currentSession = this.session.get();
    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    const tableSessionsRequest = this.tables.tableSessions(token, validatedInput.tableId);
    return tableSessionsRequest;
  }
}
