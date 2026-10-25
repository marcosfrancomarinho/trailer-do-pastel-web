import { RemoveProduct } from '../../validation/catalog/remove-product.ts';
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { CatalogGateway } from '../../gateways/catalog-gateway';
import type { RemoveCatalogItemInput } from '../../dtos/catalog';
import type { SessionGateway } from '../../gateways/session-gateway';

export class RemoveProductUseCase {
  private catalog: CatalogGateway;
  private session: SessionGateway;

  public constructor(catalog: CatalogGateway, session: SessionGateway) {
    this.catalog = catalog;
    this.session = session;
  }

  public execute(input: RemoveCatalogItemInput) {
    const validatedInput = RemoveProduct.validate(input);
    const currentSession = this.session.get();
    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    const id = validatedInput.id;
    return this.catalog.removeProduct(id, token);
  }
}
