export interface Category { id: string; name: string }
export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: string;
  imageUrl?: string | null;
  available: boolean;
}
export interface Addition { id: string; name: string; price: string; available: boolean }

export interface ProductData {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  imageUrl: string | null;
  additionIds: string[];
  available: boolean;
}

export interface AdditionData { name: string; price: string; available: boolean }
export interface CategoryData { name: string }

export interface CreateCatalogItemInput<T> { data: T }
export type UpdateCatalogItemInput<T> = CreateCatalogItemInput<T> & { id: string };
export interface RemoveCatalogItemInput { id: string }
export interface ListCatalogOutput { categories: Category[]; products: Product[] }
export type ListCategoriesOutput = Category[];
export type ListProductsOutput = Product[];
export type ListAdditionsOutput = Addition[];
export type ListProductAdditionsOutput = Addition[];
