import { ValidationError } from '../../errors/validation-error.ts'
import type { RemoveUserInput } from '../../dtos/users';

export class RemoveUser {
  public static validate(input: RemoveUserInput): RemoveUserInput {
    if (!input) {
      throw new ValidationError('input', 'Dados de id do usuário não informados.');
    }
    if (typeof input.userId !== 'string') {
      throw new ValidationError('userId', 'ID do usuário deve ser um texto.');
    }
    if (!input.userId.trim()) {
      throw new ValidationError('userId', 'ID do usuário é obrigatório.');
    }
    return { ...input, userId: input.userId.trim() };
  }
}
