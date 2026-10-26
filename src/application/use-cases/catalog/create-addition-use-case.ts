import { CreateAddition } from '../../validation/catalog/create-addition.ts';
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { CatalogGateway } from '../../gateways/catalog-gateway';
import type { CreateCatalogItemInput, AdditionData } from '../../dtos/catalog';
import type { SessionGateway } from '../../gateways/session-gateway';

export class CreateAdditionUseCase {
  private catalog: CatalogGateway;
  private session: SessionGateway;

  public constructor(catalog: CatalogGateway, session: SessionGateway) {
    this.catalog = catalog;
    this.session = session;
  }

  public execute(input: CreateCatalogItemInput<AdditionData>): Promise<void> {
    const validatedInput = CreateAddition.validate(input);

    const currentSession = this.session.get();

    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    const data = validatedInput.data;
    const createAdditionRequest = this.catalog.createAddition(token, data);
    return createAdditionRequest;
  }
}
