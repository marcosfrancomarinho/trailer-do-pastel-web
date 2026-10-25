import type { ActiveOrder, FindCanceledTableOrdersInput } from '../../dtos/orders';

export class FindCanceledTableOrdersUseCase {
  public execute(input: FindCanceledTableOrdersInput): ActiveOrder[] {
    const canceledIds = new Set(input.history.filter((order) => order.status === 'CANCELED').map((order) => order.id));
    return [...input.previous.values()].filter((order) =>
      order.tableNumber != null &&
      order.status !== 'PENDING' &&
      !input.current.has(order.id) &&
      canceledIds.has(order.id) &&
      !input.acknowledgedIds.has(order.id),
    );
  }
}
