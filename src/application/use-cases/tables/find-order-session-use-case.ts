import { FindOrderSession } from '../../validation/tables/find-order-session.ts';
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { TableGateway } from '../../gateways/table-gateway';
import type { RemoveTableOrderInput } from '../../dtos/tables';
import type { SessionGateway } from '../../gateways/session-gateway';

export class FindOrderSessionUseCase {
  private tables: TableGateway;
  private session: SessionGateway;

  public constructor(tables: TableGateway, session: SessionGateway) {
    this.tables = tables;
    this.session = session;
  }

  public async execute(input: RemoveTableOrderInput): Promise<string | null> {
    const validatedInput = FindOrderSession.validate(input);
    const currentSession = this.session.get();
    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    const result = await this.tables.tableSessions(token, validatedInput.tableId);
    return result.sessions.find((session) => session.orders.some((order) => order.id === validatedInput.orderId))?.id ?? null;
  }
}
