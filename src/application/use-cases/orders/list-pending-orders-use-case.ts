import { ListPendingOrders } from '../../validation/orders/list-pending-orders.ts'
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts'
import type { OrderGateway } from '../../gateways/order-gateway'
import type { ListOrdersInput } from '../../dtos/orders'
import type { SessionGateway } from '../../gateways/session-gateway'

export class ListPendingOrdersUseCase {
  private orders: OrderGateway
  private session: SessionGateway

  public constructor(orders: OrderGateway, session: SessionGateway) {
    this.orders = orders
    this.session = session
  }

  public execute(input: ListOrdersInput) {
    const validatedInput = ListPendingOrders.validate(input)
    const currentSession = this.session.get()
    if (!currentSession) {
      throw new AdminSessionNotFoundError()
    }
    const token = currentSession.token
    return this.orders.pending(token, validatedInput.date)
  }
}
