import { GetTableReleaseStatus } from '../../validation/tables/get-table-release-status.ts';
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { TableGateway } from '../../gateways/table-gateway';
import type { TableIdInput, TableReleaseStatusOutput } from '../../dtos/tables';
import type { SessionGateway } from '../../gateways/session-gateway';

export class GetTableReleaseStatusUseCase {
  private tables: TableGateway;
  private session: SessionGateway;

  public constructor(tables: TableGateway, session: SessionGateway) {
    this.tables = tables;
    this.session = session;
  }

  public async execute(input: TableIdInput): Promise<TableReleaseStatusOutput> {
    const validatedInput = GetTableReleaseStatus.validate(input);
    const currentSession = this.session.get();
    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    const table = await this.tables.tableOrders(token, validatedInput.tableId);
    const unfinishedCount = table.orders.filter((order) => ['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status)).length;
    return { table, unfinishedCount };
  }
}
