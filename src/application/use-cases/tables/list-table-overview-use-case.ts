import type { ListTablesUseCase } from './list-tables-use-case';
import type { ListTableOrdersUseCase } from './list-table-orders-use-case';
import type { ListTableOverviewOutput } from '../../dtos/tables';

export class ListTableOverviewUseCase {
  private readonly listTables: ListTablesUseCase;
  private readonly listOrders: ListTableOrdersUseCase;

  public constructor(
    listTables: ListTablesUseCase,
    listOrders: ListTableOrdersUseCase,
  ) {
    this.listTables = listTables;
    this.listOrders = listOrders;
  }

  public async execute(previousReady: ReadonlySet<string> = new Set<string>()): Promise<ListTableOverviewOutput> {
    const tables = await this.listTables.execute();
    const occupied = tables.filter((table) => table.status === 'OCCUPIED');
    const ordersRequests = occupied.map((table) => this.listOrders.execute({ tableId: table.id }));
    const results = await Promise.allSettled(ordersRequests);
    const readyTableIds = new Set<string>();
    results.forEach((result, index) => {
      const tableId = occupied[index].id;
      if (result.status === 'fulfilled') {
        const orders = result.value.orders;
        const allOrdersCompleted = orders.length > 0 && orders.every((order) => order.status === 'COMPLETED');
        if (allOrdersCompleted) readyTableIds.add(tableId);
      } else if (previousReady.has(tableId)) {
        readyTableIds.add(tableId);
      }
    });
    return { tables, readyTableIds };
  }
}
