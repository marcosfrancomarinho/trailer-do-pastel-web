import { ValidationError } from '../../errors/validation-error.ts'
import type { UpdateCatalogItemInput, CategoryData } from '../../dtos/catalog';

export class UpdateCategory {
  public static validate(input: UpdateCatalogItemInput<CategoryData>): UpdateCatalogItemInput<CategoryData> {
    if (!input) {
      throw new ValidationError('input', 'Dados de categoria não informados.');
    }
    if (typeof input.id !== 'string') {
      throw new ValidationError('id', 'ID da categoria deve ser um texto.');
    }
    if (!input.id.trim()) {
      throw new ValidationError('id', 'ID da categoria é obrigatório.');
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
    return { ...input, id: input.id.trim(), data: { ...data, name: data.name.trim() } };
  }
}
