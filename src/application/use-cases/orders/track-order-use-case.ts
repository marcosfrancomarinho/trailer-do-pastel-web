import { TrackOrder } from '../../validation/orders/track-order.ts'
import type { OrderGateway } from '../../gateways/order-gateway'
import type { TrackOrderInput, TrackOrderOutput } from '../../dtos/orders'

export class TrackOrderUseCase {
  private orders: OrderGateway

  public constructor(orders: OrderGateway) {
    this.orders = orders
  }

  public execute(input: TrackOrderInput): Promise<TrackOrderOutput> {
    const validatedInput = TrackOrder.validate(input)
    const trackedOrderRequest = this.orders.tracking(validatedInput.trackingToken, validatedInput.signal)
    return trackedOrderRequest
  }
}
