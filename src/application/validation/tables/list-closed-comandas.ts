import { ValidationError } from '../../errors/validation-error.ts'
import type { ListClosedComandasInput } from '../../dtos/tables';

export class ListClosedComandas {
  public static validate(input: ListClosedComandasInput): ListClosedComandasInput {
    if (!input) {
      throw new ValidationError('input', 'Dados de filtro não informados.');
    }
    if (input.date === undefined) return { ...input };
    if (typeof input.date !== 'string') {
      throw new ValidationError('date', 'Data deve ser um texto.');
    }
    const date = input.date.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new ValidationError('date', 'Data deve estar no formato AAAA-MM-DD.');
    }
    const parsedDate = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new ValidationError('date', 'Data inválida ou fora do intervalo permitido.');
    }
    if (parsedDate.toISOString().slice(0, 10) !== date) {
      throw new ValidationError('date', 'Data não existe no calendário.');
    }
    return { ...input, date };
  }
}
