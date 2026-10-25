import type { CatalogGateway } from '../../gateways/catalog-gateway';

export class ListProductsUseCase {
  private catalog: CatalogGateway;

  public constructor(catalog: CatalogGateway) {
    this.catalog = catalog;
  }

  public execute() {
    return this.catalog.products();
  }
}
