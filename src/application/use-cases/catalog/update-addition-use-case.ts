import { UpdateAddition } from '../../validation/catalog/update-addition.ts';
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { CatalogGateway } from '../../gateways/catalog-gateway';
import type { UpdateCatalogItemInput, AdditionData } from '../../dtos/catalog';
import type { SessionGateway } from '../../gateways/session-gateway';

export class UpdateAdditionUseCase {
  private catalog: CatalogGateway;
  private session: SessionGateway;

  public constructor(catalog: CatalogGateway, session: SessionGateway) {
    this.catalog = catalog;
    this.session = session;
  }

  public execute(input: UpdateCatalogItemInput<AdditionData>) {
    const validatedInput = UpdateAddition.validate(input);
    const currentSession = this.session.get();
    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    const id = validatedInput.id;
    const data = validatedInput.data;
    return this.catalog.updateAddition(id, token, data);
  }
}
