import type { CatalogGateway } from '../../gateways/catalog-gateway';
import type { ListProductsOutput } from '../../dtos/catalog';

export class ListProductsUseCase {
  private catalog: CatalogGateway;

  public constructor(catalog: CatalogGateway) {
    this.catalog = catalog;
  }

  public execute(): Promise<ListProductsOutput> {
    const productsRequest = this.catalog.products();
    return productsRequest;
  }
}
