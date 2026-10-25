import { ListProductAdditions } from '../../validation/catalog/list-product-additions.ts';
import type { CatalogGateway } from '../../gateways/catalog-gateway';

export class ListProductAdditionsUseCase {
  private catalog: CatalogGateway;

  public constructor(catalog: CatalogGateway) {
    this.catalog = catalog;
  }

  public execute(productId: string) {
    const validatedInput = ListProductAdditions.validate(productId);
    return this.catalog.additions(validatedInput);
  }
}
