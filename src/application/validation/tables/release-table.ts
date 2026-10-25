import { ValidationError } from '../../errors/validation-error.ts'
import type { TableIdInput } from '../../dtos/tables';

export class ReleaseTable {
  public static validate(input: TableIdInput): TableIdInput {
    if (!input) {
      throw new ValidationError('input', 'Dados de id da mesa não informados.');
    }
    if (typeof input.tableId !== 'string') {
      throw new ValidationError('tableId', 'ID da mesa deve ser um texto.');
    }
    if (!input.tableId.trim()) {
      throw new ValidationError('tableId', 'ID da mesa é obrigatório.');
    }
    return { ...input, tableId: input.tableId.trim() };
  }
}
