import { ChangeStoreStatus } from '../../validation/store/change-store-status.ts';
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { StoreGateway } from '../../gateways/store-gateway';
import type { ChangeStoreStatusInput } from '../../dtos/store';
import type { SessionGateway } from '../../gateways/session-gateway';

export class ChangeStoreStatusUseCase {
  private store: StoreGateway;
  private session: SessionGateway;

  public constructor(store: StoreGateway, session: SessionGateway) {
    this.store = store;
    this.session = session;
  }

  public execute(input: ChangeStoreStatusInput) {
    const validatedInput = ChangeStoreStatus.validate(input);
    const currentSession = this.session.get();
    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    return this.store.setStoreOpen(token, validatedInput.open);
  }
}
