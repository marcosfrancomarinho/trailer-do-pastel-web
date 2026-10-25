import type { SessionGateway } from '../../gateways/session-gateway';

export class GetSessionUseCase {
  private session: SessionGateway;

  public constructor(session: SessionGateway) {
    this.session = session;
  }

  public execute() {
    return this.session.get();
  }
}
