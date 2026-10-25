import type { AdminSession } from '../dtos/auth'

export interface SessionGateway {
  get(): AdminSession | null
  save(session: AdminSession): void
  clear(): void
}
