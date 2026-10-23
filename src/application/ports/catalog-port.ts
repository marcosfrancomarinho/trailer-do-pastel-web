import type { Addition, Category, Product } from '../../domain/models'
export interface CatalogPort {
  categories(): Promise<Category[]>
  products(): Promise<Product[]>
  additions(productId: string): Promise<Addition[]>
  allAdditions(): Promise<Addition[]>
  createCatalog(kind: 'products' | 'additions' | 'categories' | 'users', token: string, data: unknown): Promise<void>
  update(kind: 'products' | 'additions' | 'categories', id: string, token: string, data: unknown): Promise<void>
  remove(kind: 'products' | 'additions' | 'categories', id: string, token: string): Promise<void>
}
