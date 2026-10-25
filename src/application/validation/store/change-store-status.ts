import { ValidationError } from '../../errors/validation-error.ts'
import type { ChangeStoreStatusInput } from '../../dtos/store';

export class ChangeStoreStatus {
  public static validate(input: ChangeStoreStatusInput): ChangeStoreStatusInput {
    if (!input) {
      throw new ValidationError('input', 'Dados de alteração da loja não informados.');
    }
    if (typeof input.open !== 'boolean') {
      throw new ValidationError('open', 'Estado da loja deve ser verdadeiro ou falso.');
    }
    return { ...input };
  }
}
