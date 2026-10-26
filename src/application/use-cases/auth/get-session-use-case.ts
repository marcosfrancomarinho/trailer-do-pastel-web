import type { SessionGateway } from '../../gateways/session-gateway';
import type { GetSessionOutput } from '../../dtos/auth';

export class GetSessionUseCase {
  private session: SessionGateway;

  public constructor(session: SessionGateway) {
    this.session = session;
  }

  public execute(): GetSessionOutput | null {
    const session = this.session.get();
    return session;
  }
}
