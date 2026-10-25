import { SetSoundPreference } from '../../validation/notifications/set-sound-preference.ts';
import type { NotificationPreferenceGateway } from '../../gateways/notification-preference-gateway';

export class SetSoundPreferenceUseCase {
  private preference: NotificationPreferenceGateway;

  public constructor(preference: NotificationPreferenceGateway) {
    this.preference = preference;
  }

  public execute(enabled: boolean): void {
    const validatedInput = SetSoundPreference.validate(enabled);
    this.preference.setSoundEnabled(validatedInput);
  }
}
