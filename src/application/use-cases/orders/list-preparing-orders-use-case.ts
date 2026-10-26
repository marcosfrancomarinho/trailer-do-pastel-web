import { ListPreparingOrders } from '../../validation/orders/list-preparing-orders.ts'
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts'
import type { OrderGateway } from '../../gateways/order-gateway'
import type { ListOrdersInput, ListPreparingOrdersOutput } from '../../dtos/orders'
import type { SessionGateway } from '../../gateways/session-gateway'

export class ListPreparingOrdersUseCase {
  private orders: OrderGateway
  private session: SessionGateway

  public constructor(orders: OrderGateway, session: SessionGateway) {
    this.orders = orders
    this.session = session
  }

  public execute(input: ListOrdersInput): Promise<ListPreparingOrdersOutput> {
    const validatedInput = ListPreparingOrders.validate(input)
    const currentSession = this.session.get()
    if (!currentSession) {
      throw new AdminSessionNotFoundError()
    }
    const token = currentSession.token
    const preparingOrdersRequest = this.orders.preparing(token, validatedInput.date)
    return preparingOrdersRequest
  }
}
