import type { OrderGateway } from '../../application/gateways/order-gateway';
import type { CreatedOrder, OrderHistoryItem, OrderPayload, PendingOrder, PreparingOrder, TrackedOrder } from '../../application/dtos/orders';
import type { ApiClient } from './api-client';
import { authHeaders, queryDate } from './http-helpers';

export class OrderHttpAdapter implements OrderGateway {
  private apiClient: ApiClient;

  public constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  public create(data: OrderPayload, token?: string) {
    return this.apiClient.request<CreatedOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
      ...(token ? { headers: authHeaders(token) } : {}),
    });
  }

  public pending(token: string, date?: string) {
    return this.apiClient.request<PendingOrder[]>('/orders/pending' + queryDate(date), { headers: authHeaders(token) });
  }

  public preparing(token: string, date?: string) {
    return this.apiClient.request<PreparingOrder[]>('/orders/preparing' + queryDate(date), { headers: authHeaders(token) });
  }

  public history(token: string, date?: string) {
    return this.apiClient.request<OrderHistoryItem[]>('/orders/history' + queryDate(date), { headers: authHeaders(token) });
  }

  public tracking(token: string, signal?: AbortSignal) {
    return this.apiClient.request<TrackedOrder>('/orders/tracking/' + encodeURIComponent(token), { signal });
  }

  public async changeStatus(token: string, id: string, status: string) {
    await this.apiClient.request('/orders/' + encodeURIComponent(id) + '/status', {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ status }),
    });
  }
}
