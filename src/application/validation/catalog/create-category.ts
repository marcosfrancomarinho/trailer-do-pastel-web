import { ValidationError } from '../../errors/validation-error.ts'
import type { CreateCatalogItemInput, CategoryData } from '../../dtos/catalog';

export class CreateCategory {
  public static validate(input: CreateCatalogItemInput<CategoryData>): CreateCatalogItemInput<CategoryData> {
    if (!input) {
      throw new ValidationError('input', 'Dados de categoria não informados.');
    }
    if (!input.data) {
      throw new ValidationError('data', 'Dados do categoria não informados.');
    }
    const data = input.data;
    if (typeof data.name !== 'string') {
      throw new ValidationError('data.name', 'Nome da categoria deve ser um texto.');
    }
    if (!data.name.trim()) {
      throw new ValidationError('data.name', 'Nome da categoria é obrigatório.');
    }
    return { ...input, data: { ...data, name: data.name.trim() } };
  }
}
