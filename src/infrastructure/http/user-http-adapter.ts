import type { UserGateway } from '../../application/gateways/user-gateway';
import type { RestaurantUser } from '../../application/dtos/users';
import type { ApiClient } from './api-client';
import { authHeaders } from './http-helpers';

export class UserHttpAdapter implements UserGateway {
  private apiClient: ApiClient;

  public constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  public users(token: string) {
    return this.apiClient.request<RestaurantUser[]>('/users', { headers: authHeaders(token) });
  }

  public async createUser(token: string, data: { name: string; password: string }) {
    await this.apiClient.request('/users', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(data) });
  }

  public removeUser(token: string, userId: string) {
    return this.apiClient.request<void>('/users/' + encodeURIComponent(userId), { method: 'DELETE', headers: authHeaders(token) });
  }
}
