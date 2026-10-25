import { ValidationError } from '../../errors/validation-error.ts'

export class RemoveSavedOrder {
  public static validate(trackingToken: string): string {
    if (typeof trackingToken !== 'string') {
      throw new ValidationError('trackingToken', 'Código de acompanhamento deve ser um texto.')
    }
    if (!trackingToken.trim()) {
      throw new ValidationError('trackingToken', 'Código de acompanhamento é obrigatório.')
    }
    return trackingToken.trim()
  }
}
