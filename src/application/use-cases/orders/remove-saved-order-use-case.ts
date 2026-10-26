import { RemoveSavedOrder } from '../../validation/orders/remove-saved-order.ts'
import type { OrderHistoryGateway } from '../../gateways/order-history-gateway'
import type { RemoveSavedOrderOutput } from '../../dtos/orders'

export class RemoveSavedOrderUseCase {
  private history: OrderHistoryGateway

  public constructor(history: OrderHistoryGateway) {
    this.history = history
  }

  public execute(trackingToken: string): RemoveSavedOrderOutput {
    const validatedInput = RemoveSavedOrder.validate(trackingToken)
    const savedOrders = this.history.remove(validatedInput)
    return savedOrders
  }
}
