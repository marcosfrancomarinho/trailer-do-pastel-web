import type { ListTablesUseCase } from './list-tables-use-case';
import type { ListTableOrdersUseCase } from './list-table-orders-use-case';

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

  public async execute(previousReady: ReadonlySet<string> = new Set<string>()) {
    const tables = await this.listTables.execute();
    const occupied = tables.filter((table) => table.status === 'OCCUPIED');
    const results = await Promise.allSettled(
      occupied.map((table) => this.listOrders.execute({ tableId: table.id })),
    );
    const readyTableIds = new Set<string>();
    results.forEach((result, index) => {
      const tableId = occupied[index].id;
      if (result.status === 'fulfilled') {
        const orders = result.value.orders;
        if (orders.length > 0 && orders.every((order) => order.status === 'COMPLETED')) readyTableIds.add(tableId);
      } else if (previousReady.has(tableId)) {
        readyTableIds.add(tableId);
      }
    });
    return { tables, readyTableIds };
  }
}
