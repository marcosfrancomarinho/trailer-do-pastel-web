import { CreateTable } from '../../validation/tables/create-table.ts';
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { TableGateway } from '../../gateways/table-gateway';
import type { CreateTableInput } from '../../dtos/tables';
import type { SessionGateway } from '../../gateways/session-gateway';

export class CreateTableUseCase {
  private tables: TableGateway;
  private session: SessionGateway;

  public constructor(tables: TableGateway, session: SessionGateway) {
    this.tables = tables;
    this.session = session;
  }

  public execute(input: CreateTableInput) {
    const validatedInput = CreateTable.validate(input);
    const currentSession = this.session.get();
    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    return this.tables.createTable(token, validatedInput.number);
  }
}
