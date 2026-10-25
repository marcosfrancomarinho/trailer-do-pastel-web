import type { ListCatalogOutput } from '../../dtos/catalog';
import type { ListCategoriesUseCase } from './list-categories-use-case';
import type { ListProductsUseCase } from './list-products-use-case';

export class ListCatalogUseCase {
  private listCategories: ListCategoriesUseCase;
  private listProducts: ListProductsUseCase;

  public constructor(listCategories: ListCategoriesUseCase, listProducts: ListProductsUseCase) {
    this.listCategories = listCategories;
    this.listProducts = listProducts;
  }

  public async execute(): Promise<ListCatalogOutput> {
    const categoriesRequest = this.listCategories.execute();
    const productsRequest = this.listProducts.execute();
    const requests = [categoriesRequest, productsRequest] as const;
    const [categories, products] = await Promise.all(requests);
    return { categories, products };
  }
}
