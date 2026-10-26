import { ArchiveTable } from '../../validation/tables/archive-table.ts';
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { TableGateway } from '../../gateways/table-gateway';
import type { TableIdInput } from '../../dtos/tables';
import type { SessionGateway } from '../../gateways/session-gateway';

export class ArchiveTableUseCase {
  private tables: TableGateway;
  private session: SessionGateway;

  public constructor(tables: TableGateway, session: SessionGateway) {
    this.tables = tables;
    this.session = session;
  }

  public execute(input: TableIdInput): Promise<void> {
    const validatedInput = ArchiveTable.validate(input);
    const currentSession = this.session.get();
    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    const archiveTableRequest = this.tables.archiveTable(token, validatedInput.tableId);
    return archiveTableRequest;
  }
}
