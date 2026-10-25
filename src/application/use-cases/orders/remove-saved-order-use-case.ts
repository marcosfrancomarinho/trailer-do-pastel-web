import { RemoveSavedOrder } from '../../validation/orders/remove-saved-order.ts'
import type { OrderHistoryGateway } from '../../gateways/order-history-gateway'

export class RemoveSavedOrderUseCase {
  private history: OrderHistoryGateway

  public constructor(history: OrderHistoryGateway) {
    this.history = history
  }

  public execute(trackingToken: string) {
    const validatedInput = RemoveSavedOrder.validate(trackingToken)
    return this.history.remove(validatedInput)
  }
}
