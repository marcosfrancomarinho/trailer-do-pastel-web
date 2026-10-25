import { ValidationError } from '../../errors/validation-error.ts'
import type { UpdateOrderStatusInput } from '../../dtos/orders'

export class UpdateOrderStatus {
  public static validate(input: UpdateOrderStatusInput): UpdateOrderStatusInput {
    if (!input) {
      throw new ValidationError('input', 'Dados de alteração do pedido não informados.')
    }
    if (typeof input.orderId !== 'string') {
      throw new ValidationError('orderId', 'ID do pedido deve ser um texto.')
    }
    if (!input.orderId.trim()) {
      throw new ValidationError('orderId', 'ID do pedido é obrigatório.')
    }
    if (typeof input.status !== 'string') {
      throw new ValidationError('status', 'Status do pedido deve ser um texto.')
    }
    const status = input.status.trim()
    const allowedStatuses = ['CONFIRMED', 'PREPARING', 'COMPLETED', 'CANCELED']
    if (!allowedStatuses.includes(status)) {
      throw new ValidationError('status', 'Status do pedido não é permitido.')
    }
    return { ...input, orderId: input.orderId.trim(), status }
  }
}
