import { ListProductAdditions } from '../../validation/catalog/list-product-additions.ts';
import type { CatalogGateway } from '../../gateways/catalog-gateway';
import type { ListProductAdditionsOutput } from '../../dtos/catalog';

export class ListProductAdditionsUseCase {
  private catalog: CatalogGateway;

  public constructor(catalog: CatalogGateway) {
    this.catalog = catalog;
  }

  public execute(productId: string): Promise<ListProductAdditionsOutput> {
    const validatedInput = ListProductAdditions.validate(productId);
    const additionsRequest = this.catalog.additions(validatedInput);
    return additionsRequest;
  }
}
