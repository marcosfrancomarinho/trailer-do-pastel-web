import { ValidationError } from '../../errors/validation-error.ts'
import type { CreateCatalogItemInput, ProductData } from '../../dtos/catalog';

export class CreateProduct {
  public static validate(input: CreateCatalogItemInput<ProductData>): CreateCatalogItemInput<ProductData> {
    if (!input) {
      throw new ValidationError('input', 'Dados de produto não informados.');
    }
    if (!input.data) {
      throw new ValidationError('data', 'Dados do produto não informados.');
    }
    const data = input.data;
    if (typeof data.name !== 'string') {
      throw new ValidationError('data.name', 'Nome do produto deve ser um texto.');
    }
    if (!data.name.trim()) {
      throw new ValidationError('data.name', 'Nome do produto é obrigatório.');
    }
    if (typeof data.description !== 'string') {
      throw new ValidationError('data.description', 'Descrição do produto deve ser um texto.');
    }
    if (typeof data.price !== 'string') {
      throw new ValidationError('data.price', 'Preço do produto deve ser um texto.');
    }
    if (!data.price.trim()) {
      throw new ValidationError('data.price', 'Preço do produto é obrigatório.');
    }
    const price = Number(data.price);
    if (!Number.isFinite(price)) {
      throw new ValidationError('data.price', 'Preço do produto deve ser numérico.');
    }
    if (price <= 0) {
      throw new ValidationError('data.price', 'Preço do produto deve ser maior que zero.');
    }
    if (typeof data.categoryId !== 'string') {
      throw new ValidationError('data.categoryId', 'ID da categoria deve ser um texto.');
    }
    if (!data.categoryId.trim()) {
      throw new ValidationError('data.categoryId', 'ID da categoria é obrigatório.');
    }
    if (data.imageUrl !== null) {
      if (typeof data.imageUrl !== 'string') {
        throw new ValidationError('data.imageUrl', 'URL da imagem deve ser um texto.');
      }
      if (!data.imageUrl.trim()) {
        throw new ValidationError('data.imageUrl', 'URL da imagem não pode estar vazia.');
      }
    }
    if (!Array.isArray(data.additionIds)) {
      throw new ValidationError('data.additionIds', 'Lista de adicionais inválida.');
    }
    for (const [index, additionId] of data.additionIds.entries()) {
      if (typeof additionId !== 'string') {
        throw new ValidationError(`data.additionIds[${index}]`, `Adicional ${index + 1}: ID deve ser um texto.`);
      }
      if (!additionId.trim()) {
        throw new ValidationError(`data.additionIds[${index}]`, `Adicional ${index + 1}: ID é obrigatório.`);
      }
    }
    if (typeof data.available !== 'boolean') {
      throw new ValidationError('data.available', 'Disponibilidade do produto inválida.');
    }
    return {
      ...input,
      data: {
        ...data,
        name: data.name.trim(),
        description: data.description.trim(),
        price: data.price.trim(),
        categoryId: data.categoryId.trim(),
        imageUrl: data.imageUrl === null ? null : data.imageUrl.trim(),
        additionIds: data.additionIds.map((id) => id.trim()),
      },
    };
  }
}
