import { CreateProduct } from '../../validation/catalog/create-product.ts';
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { CatalogGateway } from '../../gateways/catalog-gateway';
import type { CreateCatalogItemInput, ProductData } from '../../dtos/catalog';
import type { SessionGateway } from '../../gateways/session-gateway';

export class CreateProductUseCase {
  private catalog: CatalogGateway;
  private session: SessionGateway;

  public constructor(catalog: CatalogGateway, session: SessionGateway) {
    this.catalog = catalog;
    this.session = session;
  }

  public execute(input: CreateCatalogItemInput<ProductData>): Promise<void> {
    const validatedInput = CreateProduct.validate(input);
    const currentSession = this.session.get();
    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    const data = validatedInput.data;
    const createProductRequest = this.catalog.createProduct(token, data);
    return createProductRequest;
  }
}
