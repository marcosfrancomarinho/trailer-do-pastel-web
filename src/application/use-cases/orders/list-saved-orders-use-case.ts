import type { OrderHistoryGateway } from '../../gateways/order-history-gateway'
import type { ListSavedOrdersOutput } from '../../dtos/orders'

export class ListSavedOrdersUseCase {
  private history: OrderHistoryGateway

  public constructor(history: OrderHistoryGateway) {
    this.history = history
  }

  public execute(): ListSavedOrdersOutput {
    const savedOrders = this.history.list()
    return savedOrders
  }
}
