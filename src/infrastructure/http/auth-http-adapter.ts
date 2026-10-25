import type { AuthGateway } from '../../application/gateways/auth-gateway';
import type { SignInOutput } from '../../application/dtos/auth';
import type { ApiClient } from './api-client';

export class AuthHttpAdapter implements AuthGateway {
  private apiClient: ApiClient;

  public constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  public async signIn(name: string, password: string): Promise<SignInOutput> {
    const result = await this.apiClient.request<{ name: string; role: 'ADMIN' | 'EMPLOYEE'; accessToken: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ name, password }),
    });
    return { token: result.accessToken, name: result.name, role: result.role };
  }
}
