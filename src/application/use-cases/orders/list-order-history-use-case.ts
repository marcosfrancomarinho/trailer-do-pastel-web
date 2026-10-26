import { ListOrderHistory } from '../../validation/orders/list-order-history.ts'
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts'
import type { OrderGateway } from '../../gateways/order-gateway'
import type { ListOrdersInput, ListOrderHistoryOutput } from '../../dtos/orders'
import type { SessionGateway } from '../../gateways/session-gateway'

export class ListOrderHistoryUseCase {
  private orders: OrderGateway
  private session: SessionGateway

  public constructor(orders: OrderGateway, session: SessionGateway) {
    this.orders = orders
    this.session = session
  }

  public execute(input: ListOrdersInput): Promise<ListOrderHistoryOutput> {
    const validatedInput = ListOrderHistory.validate(input)
    const currentSession = this.session.get()
    if (!currentSession) {
      throw new AdminSessionNotFoundError()
    }
    const token = currentSession.token
    const orderHistoryRequest = this.orders.history(token, validatedInput.date)
    return orderHistoryRequest
  }
}
