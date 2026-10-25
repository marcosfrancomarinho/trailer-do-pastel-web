import { ValidationError } from '../../errors/validation-error.ts'
import type { RemoveTableOrderInput } from '../../dtos/tables';

export class FindOrderSession {
  public static validate(input: RemoveTableOrderInput): RemoveTableOrderInput {
    if (!input) {
      throw new ValidationError('input', 'Dados de pedido da mesa não informados.');
    }
    if (typeof input.tableId !== 'string') {
      throw new ValidationError('tableId', 'ID da mesa deve ser um texto.');
    }
    if (!input.tableId.trim()) {
      throw new ValidationError('tableId', 'ID da mesa é obrigatório.');
    }
    if (typeof input.orderId !== 'string') {
      throw new ValidationError('orderId', 'ID do pedido deve ser um texto.');
    }
    if (!input.orderId.trim()) {
      throw new ValidationError('orderId', 'ID do pedido é obrigatório.');
    }
    return { ...input, tableId: input.tableId.trim(), orderId: input.orderId.trim() };
  }
}
