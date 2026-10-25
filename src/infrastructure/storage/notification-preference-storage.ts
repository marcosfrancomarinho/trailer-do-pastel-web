import type { NotificationPreferenceGateway } from '../../application/gateways/notification-preference-gateway';

export class NotificationPreferenceStorageAdapter implements NotificationPreferenceGateway {
  private KEY = 'admin-order-sound';
  public isSoundEnabled(): boolean {
    return window.localStorage.getItem(this.KEY) !== 'off';
  }

  public setSoundEnabled(enabled: boolean): void {
    window.localStorage.setItem(this.KEY, enabled ? 'on' : 'off');
    window.dispatchEvent(new Event('admin-notification-preference'));
  }
}
