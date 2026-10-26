import type { CatalogGateway } from '../../gateways/catalog-gateway';
import type { ListAdditionsOutput } from '../../dtos/catalog';

export class ListAdditionsUseCase {
  private catalog: CatalogGateway;

  public constructor(catalog: CatalogGateway) {
    this.catalog = catalog;
  }

  public execute(): Promise<ListAdditionsOutput> {
    const additionsRequest = this.catalog.allAdditions();
    return additionsRequest;
  }
}
