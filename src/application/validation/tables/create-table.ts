import { ValidationError } from '../../errors/validation-error.ts'
import type { CreateTableInput } from '../../dtos/tables';

export class CreateTable {
  public static validate(input: CreateTableInput): CreateTableInput {
    if (!input) {
      throw new ValidationError('input', 'Dados de mesa não informados.');
    }
    if (!Number.isSafeInteger(input.number)) {
      throw new ValidationError('number', 'Número da mesa deve ser um inteiro.');
    }
    if (input.number < 1) {
      throw new ValidationError('number', 'Número da mesa deve ser maior que zero.');
    }
    return { ...input };
  }
}
