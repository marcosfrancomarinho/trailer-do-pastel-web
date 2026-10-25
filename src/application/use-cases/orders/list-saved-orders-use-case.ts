import type { OrderHistoryGateway } from '../../gateways/order-history-gateway'

export class ListSavedOrdersUseCase {
  private history: OrderHistoryGateway

  public constructor(history: OrderHistoryGateway) {
    this.history = history
  }

  public execute() {
    return this.history.list()
  }
}
