import { ValidationError } from '../../errors/validation-error.ts'
import type { SignInInput } from '../../dtos/auth';

export class SignIn {
  public static validate(input: SignInInput): SignInInput {
    if (!input) {
      throw new ValidationError('input', 'Dados de login não informados.');
    }
    if (typeof input.name !== 'string') {
      throw new ValidationError('name', 'Nome de usuário deve ser um texto.');
    }
    if (!input.name.trim()) {
      throw new ValidationError('name', 'Nome de usuário é obrigatório.');
    }
    if (typeof input.password !== 'string') {
      throw new ValidationError('password', 'Senha deve ser um texto.');
    }
    if (!input.password) {
      throw new ValidationError('password', 'Informe a senha.');
    }
    return { ...input, name: input.name.trim() };
  }
}
