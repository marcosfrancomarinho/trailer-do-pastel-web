import { ValidationError } from '../../errors/validation-error.ts'
import type { RemoveCatalogItemInput } from '../../dtos/catalog';

export class RemoveCategory {
  public static validate(input: RemoveCatalogItemInput): RemoveCatalogItemInput {
    if (!input) {
      throw new ValidationError('input', 'Dados de id da categoria não informados.');
    }
    if (typeof input.id !== 'string') {
      throw new ValidationError('id', 'ID da categoria deve ser um texto.');
    }
    if (!input.id.trim()) {
      throw new ValidationError('id', 'ID da categoria é obrigatório.');
    }
    return { ...input, id: input.id.trim() };
  }
}
