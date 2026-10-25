import type { StoreGateway } from '../../application/gateways/store-gateway';
import type { StoreState } from '../../application/dtos/store';
import type { ApiClient } from './api-client';
import { authHeaders } from './http-helpers';

export class StoreHttpAdapter implements StoreGateway {
  private apiClient: ApiClient;

  public constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  public storeStatus() {
    return this.apiClient.request<StoreState>('/store/status');
  }

  public setStoreOpen(token: string, open: boolean) {
    return this.apiClient.request<StoreState>(open ? '/store/open' : '/store/close', {
      method: 'POST',
      headers: authHeaders(token),
    });
  }
}
