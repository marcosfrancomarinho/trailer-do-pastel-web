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
    const tableOrderStatuses = new Map<string, 'PENDING' | 'PREPARING' | 'COMPLETED'>();
    results.forEach((result, index) => {
      const tableId = occupied[index].id;
      if (result.status === 'fulfilled') {
        const orders = result.value.orders;
        const activeOrders = orders.filter((order) => order.status !== 'CANCELED');
        if (activeOrders.some((order) => order.status === 'PENDING')) tableOrderStatuses.set(tableId, 'PENDING');
        else if (activeOrders.some((order) => ['CONFIRMED', 'PREPARING'].includes(order.status))) tableOrderStatuses.set(tableId, 'PREPARING');
        else if (activeOrders.length > 0 && activeOrders.every((order) => order.status === 'COMPLETED')) tableOrderStatuses.set(tableId, 'COMPLETED');
        const allOrdersCompleted = orders.length > 0 && orders.every((order) => order.status === 'COMPLETED');
        if (allOrdersCompleted) readyTableIds.add(tableId);
      } else if (previousReady.has(tableId)) {
        readyTableIds.add(tableId);
      }
    });
    return { tables, readyTableIds, tableOrderStatuses };
  }
}
