export interface NotificationPreferenceGateway {
  isSoundEnabled(): boolean
  setSoundEnabled(enabled: boolean): void
}
