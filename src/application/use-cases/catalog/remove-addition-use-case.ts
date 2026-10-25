import { RemoveAddition } from '../../validation/catalog/remove-addition.ts';
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { CatalogGateway } from '../../gateways/catalog-gateway';
import type { RemoveCatalogItemInput } from '../../dtos/catalog';
import type { SessionGateway } from '../../gateways/session-gateway';

export class RemoveAdditionUseCase {
  private catalog: CatalogGateway;
  private session: SessionGateway;

  public constructor(catalog: CatalogGateway, session: SessionGateway) {
    this.catalog = catalog;
    this.session = session;
  }

  public execute(input: RemoveCatalogItemInput) {
    const validatedInput = RemoveAddition.validate(input);
    const currentSession = this.session.get();
    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    const id = validatedInput.id;
    return this.catalog.removeAddition(id, token);
  }
}
