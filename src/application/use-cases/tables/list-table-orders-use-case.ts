import { ListTableOrders } from '../../validation/tables/list-table-orders.ts';
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { TableGateway } from '../../gateways/table-gateway';
import type { TableIdInput, ListTableOrdersOutput } from '../../dtos/tables';
import type { SessionGateway } from '../../gateways/session-gateway';

export class ListTableOrdersUseCase {
  private tables: TableGateway;
  private session: SessionGateway;

  public constructor(tables: TableGateway, session: SessionGateway) {
    this.tables = tables;
    this.session = session;
  }

  public execute(input: TableIdInput): Promise<ListTableOrdersOutput> {
    const validatedInput = ListTableOrders.validate(input);
    const currentSession = this.session.get();
    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    const tableOrdersRequest = this.tables.tableOrders(token, validatedInput.tableId);
    return tableOrdersRequest;
  }
}
