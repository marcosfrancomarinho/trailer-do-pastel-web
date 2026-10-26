import { ListClosedComandas } from '../../validation/tables/list-closed-comandas.ts';
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { TableGateway } from '../../gateways/table-gateway';
import type { ListClosedComandasInput, ListClosedComandasOutput } from '../../dtos/tables';
import type { SessionGateway } from '../../gateways/session-gateway';

export class ListClosedComandasUseCase {
  private tables: TableGateway;
  private session: SessionGateway;

  public constructor(tables: TableGateway, session: SessionGateway) {
    this.tables = tables;
    this.session = session;
  }

  public execute(input: ListClosedComandasInput): Promise<ListClosedComandasOutput> {
    const validatedInput = ListClosedComandas.validate(input);
    const currentSession = this.session.get();
    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    const closedComandasRequest = this.tables.closedComandas(token, validatedInput.date);
    return closedComandasRequest;
  }
}
