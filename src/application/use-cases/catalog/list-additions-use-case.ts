import type { CatalogGateway } from '../../gateways/catalog-gateway';

export class ListAdditionsUseCase {
  private catalog: CatalogGateway;

  public constructor(catalog: CatalogGateway) {
    this.catalog = catalog;
  }

  public execute() {
    return this.catalog.allAdditions();
  }
}
