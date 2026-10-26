import type { FindCanceledTableOrdersInput, FindCanceledTableOrdersOutput } from '../../dtos/orders';

export class FindCanceledTableOrdersUseCase {
  public execute(input: FindCanceledTableOrdersInput): FindCanceledTableOrdersOutput {
    const canceledHistory = input.history.filter((order) => order.status === 'CANCELED');
    const canceledOrderIds = canceledHistory.map((order) => order.id);
    const canceledIds = new Set(canceledOrderIds);
    const canceledTableOrders = [...input.previous.values()].filter((order) =>
      order.tableNumber != null &&
      order.status !== 'PENDING' &&
      !input.current.has(order.id) &&
      canceledIds.has(order.id) &&
      !input.acknowledgedIds.has(order.id),
    );
    return canceledTableOrders;
  }
}
