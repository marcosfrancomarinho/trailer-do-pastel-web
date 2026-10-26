import type { NotificationPreferenceGateway } from '../../gateways/notification-preference-gateway'

export class GetSoundPreferenceUseCase {
  private preference: NotificationPreferenceGateway

  public constructor(preference: NotificationPreferenceGateway) {
    this.preference = preference
  }

  public execute(): boolean {
    const soundEnabled = this.preference.isSoundEnabled()
    return soundEnabled
  }
}
