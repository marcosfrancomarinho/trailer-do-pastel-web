import { ValidationError } from '../../errors/validation-error.ts'

export class ListProductAdditions {
  public static validate(productId: string): string {
    if (typeof productId !== 'string') {
      throw new ValidationError('productId', 'ID do produto deve ser um texto.');
    }
    if (!productId.trim()) {
      throw new ValidationError('productId', 'ID do produto é obrigatório.');
    }
    return productId.trim();
  }
}
