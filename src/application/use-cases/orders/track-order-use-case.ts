import { TrackOrder } from '../../validation/orders/track-order.ts'
import type { OrderGateway } from '../../gateways/order-gateway'
import type { TrackOrderInput } from '../../dtos/orders'

export class TrackOrderUseCase {
  private orders: OrderGateway

  public constructor(orders: OrderGateway) {
    this.orders = orders
  }

  public execute(input: TrackOrderInput) {
    const validatedInput = TrackOrder.validate(input)
    return this.orders.tracking(validatedInput.trackingToken, validatedInput.signal)
  }
}
