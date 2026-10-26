import { UpdateProduct } from '../../validation/catalog/update-product.ts';
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { CatalogGateway } from '../../gateways/catalog-gateway';
import type { UpdateCatalogItemInput, ProductData } from '../../dtos/catalog';
import type { SessionGateway } from '../../gateways/session-gateway';

export class UpdateProductUseCase {
  private catalog: CatalogGateway;
  private session: SessionGateway;

  public constructor(catalog: CatalogGateway, session: SessionGateway) {
    this.catalog = catalog;
    this.session = session;
  }

  public execute(input: UpdateCatalogItemInput<ProductData>): Promise<void> {
    const validatedInput = UpdateProduct.validate(input);
    const currentSession = this.session.get();
    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    const id = validatedInput.id;
    const data = validatedInput.data;
    const updateProductRequest = this.catalog.updateProduct(id, token, data);
    return updateProductRequest;
  }
}
