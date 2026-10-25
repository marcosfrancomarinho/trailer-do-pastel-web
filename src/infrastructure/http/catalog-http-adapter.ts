import type { CatalogGateway } from '../../application/gateways/catalog-gateway';
import type { AdditionData, CategoryData, ProductData, Addition, Category, Product } from '../../application/dtos/catalog';
import type { ApiClient } from './api-client';
import { authHeaders } from './http-helpers';

export class CatalogHttpAdapter implements CatalogGateway {
  private apiClient: ApiClient;

  public constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  public categories() {
    return this.apiClient.request<Category[]>('/categories');
  }

  public products() {
    return this.apiClient.request<Product[]>('/products');
  }

  public additions(id: string) {
    return this.apiClient.request<Addition[]>('/products/' + encodeURIComponent(id) + '/additions');
  }

  public allAdditions() {
    return this.apiClient.request<Addition[]>('/additions');
  }

  public async createProduct(token: string, data: ProductData): Promise<void> {
    await this.apiClient.request('/products', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
  }

  public async createAddition(token: string, data: AdditionData): Promise<void> {
    await this.apiClient.request('/additions', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
  }

  public async createCategory(token: string, data: CategoryData): Promise<void> {
    await this.apiClient.request('/categories', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
  }

  public async updateProduct(id: string, token: string, data: ProductData): Promise<void> {
    await this.apiClient.request('/products/' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
  }

  public async updateAddition(id: string, token: string, data: AdditionData): Promise<void> {
    await this.apiClient.request('/additions/' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
  }

  public async updateCategory(id: string, token: string, data: CategoryData): Promise<void> {
    await this.apiClient.request('/categories/' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
  }

  public async removeProduct(id: string, token: string): Promise<void> {
    await this.apiClient.request('/products/' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: authHeaders(token),
    });
  }

  public async removeAddition(id: string, token: string): Promise<void> {
    await this.apiClient.request('/additions/' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: authHeaders(token),
    });
  }

  public async removeCategory(id: string, token: string): Promise<void> {
    await this.apiClient.request('/categories/' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: authHeaders(token),
    });
  }
}
