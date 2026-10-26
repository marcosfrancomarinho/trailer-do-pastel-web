import { ReleaseTable } from '../../validation/tables/release-table.ts';
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { TableIdInput, ReleaseTableOutput } from '../../dtos/tables';
import type { TableGateway } from '../../gateways/table-gateway';
import type { GetTableReleaseStatusUseCase } from './get-table-release-status-use-case';
import { TableHasUnfinishedOrdersError } from '../../errors/table-has-unfinished-orders-error.ts';
import type { SessionGateway } from '../../gateways/session-gateway';

export class ReleaseTableUseCase {
  private tables: TableGateway;
  private getReleaseStatus: GetTableReleaseStatusUseCase;
  private session: SessionGateway;

  public constructor(tables: TableGateway, getReleaseStatus: GetTableReleaseStatusUseCase, session: SessionGateway) {
    this.tables = tables;
    this.getReleaseStatus = getReleaseStatus;
    this.session = session;
  }

  public async execute(input: TableIdInput): Promise<ReleaseTableOutput> {
    const validatedInput = ReleaseTable.validate(input);
    const releaseStatusInput = { tableId: validatedInput.tableId };
    const releaseStatus = await this.getReleaseStatus.execute(releaseStatusInput);
    const unfinishedCount = releaseStatus.unfinishedCount;
    if (unfinishedCount > 0) throw new TableHasUnfinishedOrdersError(unfinishedCount);
    const currentSession = this.session.get();
    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    const releasedTable = await this.tables.releaseTable(token, validatedInput.tableId);
    return releasedTable;
  }
}
