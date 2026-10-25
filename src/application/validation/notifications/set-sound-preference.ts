import { ValidationError } from '../../errors/validation-error.ts'

export class SetSoundPreference {
  public static validate(enabled: boolean): boolean {
    if (typeof enabled !== 'boolean') {
      throw new ValidationError('enabled', 'Preferência de som deve ser verdadeira ou falsa.');
    }
    return enabled;
  }
}
