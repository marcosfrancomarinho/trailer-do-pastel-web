import type { Addition, Category, Product, AdditionData, CategoryData, ProductData } from '../dtos/catalog';

export interface CatalogGateway {
  categories(): Promise<Category[]>;
  products(): Promise<Product[]>;
  additions(productId: string): Promise<Addition[]>;
  allAdditions(): Promise<Addition[]>;
  createProduct(token: string, data: ProductData): Promise<void>;
  createAddition(token: string, data: AdditionData): Promise<void>;
  createCategory(token: string, data: CategoryData): Promise<void>;
  updateProduct(id: string, token: string, data: ProductData): Promise<void>;
  updateAddition(id: string, token: string, data: AdditionData): Promise<void>;
  updateCategory(id: string, token: string, data: CategoryData): Promise<void>;
  removeProduct(id: string, token: string): Promise<void>;
  removeAddition(id: string, token: string): Promise<void>;
  removeCategory(id: string, token: string): Promise<void>;
}
