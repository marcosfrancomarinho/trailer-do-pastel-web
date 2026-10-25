import { ValidationError } from '../../errors/validation-error.ts'
import type { RemoveCatalogItemInput } from '../../dtos/catalog';

export class RemoveProduct {
  public static validate(input: RemoveCatalogItemInput): RemoveCatalogItemInput {
    if (!input) {
      throw new ValidationError('input', 'Dados de id do produto não informados.');
    }
    if (typeof input.id !== 'string') {
      throw new ValidationError('id', 'ID do produto deve ser um texto.');
    }
    if (!input.id.trim()) {
      throw new ValidationError('id', 'ID do produto é obrigatório.');
    }
    return { ...input, id: input.id.trim() };
  }
}
