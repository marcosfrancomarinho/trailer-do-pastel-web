export type Category = { id: string; name: string };
export type Product = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: string;
  imageUrl?: string | null;
  available: boolean;
};
export type Addition = { id: string; name: string; price: string; available: boolean };

export type ProductData = {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  imageUrl: string | null;
  additionIds: string[];
  available: boolean;
};

export type AdditionData = { name: string; price: string; available: boolean };
export type CategoryData = { name: string };

export type CreateCatalogItemInput<T> = { data: T };
export type UpdateCatalogItemInput<T> = CreateCatalogItemInput<T> & { id: string };
export type RemoveCatalogItemInput = { id: string };
export type ListCatalogOutput = { categories: Category[]; products: Product[] };
