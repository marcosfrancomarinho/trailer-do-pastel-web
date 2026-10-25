import { ValidationError } from '../../errors/validation-error.ts'
import type { CreateCatalogItemInput, AdditionData } from '../../dtos/catalog';

export class CreateAddition {
  public static validate(input: CreateCatalogItemInput<AdditionData>): CreateCatalogItemInput<AdditionData> {
    if (!input) {
      throw new ValidationError('input', 'Dados de adicional não informados.');
    }
    if (!input.data) {
      throw new ValidationError('data', 'Dados do adicional não informados.');
    }
    const data = input.data;
    if (typeof data.name !== 'string') {
      throw new ValidationError('data.name', 'Nome do adicional deve ser um texto.');
    }
    if (!data.name.trim()) {
      throw new ValidationError('data.name', 'Nome do adicional é obrigatório.');
    }
    if (typeof data.price !== 'string') {
      throw new ValidationError('data.price', 'Preço do adicional deve ser um texto.');
    }
    if (!data.price.trim()) {
      throw new ValidationError('data.price', 'Preço do adicional é obrigatório.');
    }
    const price = Number(data.price);
    if (!Number.isFinite(price)) {
      throw new ValidationError('data.price', 'Preço do adicional deve ser numérico.');
    }
    if (price <= 0) {
      throw new ValidationError('data.price', 'Preço do adicional deve ser maior que zero.');
    }
    if (typeof data.available !== 'boolean') {
      throw new ValidationError('data.available', 'Disponibilidade do adicional inválida.');
    }
    return { ...input, data: { ...data, name: data.name.trim(), price: data.price.trim() } };
  }
}
