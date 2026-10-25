import { ValidationError } from '../../errors/validation-error.ts'
import type { TrackOrderInput } from '../../dtos/orders'

export class TrackOrder {
  public static validate(input: TrackOrderInput): TrackOrderInput {
    if (!input) {
      throw new ValidationError('input', 'Dados de acompanhamento não informados.')
    }
    if (typeof input.trackingToken !== 'string') {
      throw new ValidationError('trackingToken', 'Código de acompanhamento deve ser um texto.')
    }
    if (!input.trackingToken.trim()) {
      throw new ValidationError('trackingToken', 'Código de acompanhamento é obrigatório.')
    }
    if (input.signal === undefined) return { ...input, trackingToken: input.trackingToken.trim() }
    if (input.signal === null) {
      throw new ValidationError('signal', 'Sinal de cancelamento não pode ser nulo.')
    }
    if (typeof input.signal !== 'object') {
      throw new ValidationError('signal', 'Sinal de cancelamento deve ser um objeto.')
    }
    if (typeof input.signal.aborted !== 'boolean') {
      throw new ValidationError('signal', 'Sinal de cancelamento inválido.')
    }
    if (typeof input.signal.addEventListener !== 'function') {
      throw new ValidationError('signal', 'Sinal de cancelamento não recebe eventos.')
    }
    return { ...input, trackingToken: input.trackingToken.trim() }
  }
}
