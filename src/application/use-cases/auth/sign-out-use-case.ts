import type { SessionGateway } from '../../gateways/session-gateway'

export class SignOutUseCase {
  private session: SessionGateway

  public constructor(session: SessionGateway) {
    this.session = session
  }

  public execute(): void {
    this.session.clear()
  }
}
