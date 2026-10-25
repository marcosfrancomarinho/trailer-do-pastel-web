import type { CatalogGateway } from '../../gateways/catalog-gateway';

export class ListCategoriesUseCase {
  private catalog: CatalogGateway;

  public constructor(catalog: CatalogGateway) {
    this.catalog = catalog;
  }

  public execute() {
    return this.catalog.categories();
  }
}
