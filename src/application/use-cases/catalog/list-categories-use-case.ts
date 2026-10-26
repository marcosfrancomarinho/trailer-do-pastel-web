import type { CatalogGateway } from '../../gateways/catalog-gateway';
import type { ListCategoriesOutput } from '../../dtos/catalog';

export class ListCategoriesUseCase {
  private catalog: CatalogGateway;

  public constructor(catalog: CatalogGateway) {
    this.catalog = catalog;
  }

  public execute(): Promise<ListCategoriesOutput> {
    const categoriesRequest = this.catalog.categories();
    return categoriesRequest;
  }
}
