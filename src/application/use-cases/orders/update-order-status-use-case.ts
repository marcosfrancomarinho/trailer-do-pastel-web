import { UpdateOrderStatus } from '../../validation/orders/update-order-status.ts'
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts'
import type { OrderGateway } from '../../gateways/order-gateway'
import type { UpdateOrderStatusInput } from '../../dtos/orders'
import type { SessionGateway } from '../../gateways/session-gateway'

export class UpdateOrderStatusUseCase {
  private orders: OrderGateway
  private session: SessionGateway

  public constructor(orders: OrderGateway, session: SessionGateway) {
    this.orders = orders
    this.session = session
  }

  public execute(input: UpdateOrderStatusInput): Promise<void> {
    const validatedInput = UpdateOrderStatus.validate(input)
    const currentSession = this.session.get()
    if (!currentSession) {
      throw new AdminSessionNotFoundError()
    }
    const token = currentSession.token
    const updateStatusRequest = this.orders.changeStatus(token, validatedInput.orderId, validatedInput.status)
    return updateStatusRequest
  }
}
