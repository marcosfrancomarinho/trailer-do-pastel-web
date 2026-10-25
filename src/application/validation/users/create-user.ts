import { ValidationError } from '../../errors/validation-error.ts'
import type { CreateUserInput } from '../../dtos/users';

export class CreateUser {
  public static validate(input: CreateUserInput): CreateUserInput {
    if (!input) {
      throw new ValidationError('input', 'Dados de usuário não informados.');
    }
    if (typeof input.name !== 'string') {
      throw new ValidationError('name', 'Nome do usuário deve ser um texto.');
    }
    if (!input.name.trim()) {
      throw new ValidationError('name', 'Nome do usuário é obrigatório.');
    }
    if (typeof input.password !== 'string') {
      throw new ValidationError('password', 'Senha deve ser um texto.');
    }
    if (input.password.length < 8) {
      throw new ValidationError('password', 'A senha deve ter pelo menos 8 caracteres.');
    }
    return { ...input, name: input.name.trim() };
  }
}
