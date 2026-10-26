import { CreateTableOrder } from '../../validation/orders/create-table-order.ts'
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts'
import { OrderPayloadMapper } from '../../mappers/order-payload.ts'
import type { OrderPayload, CreateTableOrderInput, CreateTableOrderOutput } from '../../dtos/orders'
import type { OrderGateway } from '../../gateways/order-gateway'
import type { SessionGateway } from '../../gateways/session-gateway'

export class CreateTableOrderUseCase {
  private orders: OrderGateway
  private session: SessionGateway

  public constructor(orders: OrderGateway, session: SessionGateway) {
    this.orders = orders
    this.session = session
  }

  public execute(input: CreateTableOrderInput): Promise<CreateTableOrderOutput> {
    const validatedInput = CreateTableOrder.validate(input)
    const currentSession = this.session.get()
    if (!currentSession) {
      throw new AdminSessionNotFoundError()
    }
    const token = currentSession.token
    const orderData = OrderPayloadMapper.map(validatedInput.customerName, validatedInput.customerPhone, validatedInput.cart)
    const payload: OrderPayload = {
      ...orderData,
      observation: validatedInput.observation || null,
      tableId: validatedInput.tableId,
    }
    const createOrderRequest = this.orders.create(payload, token)
    return createOrderRequest
  }
}
