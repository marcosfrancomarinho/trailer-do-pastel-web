import type { TableGateway } from '../../application/gateways/table-gateway';
import type { ReleaseTableOutput, ClosedComandaHistory, RestaurantTable, TableOrders, TableSessions } from '../../application/dtos/tables';
import type { ApiClient } from './api-client';
import { authHeaders, queryDate, tablePath } from './http-helpers';

export class TableHttpAdapter implements TableGateway {
  private apiClient: ApiClient;

  public constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  public tables(token: string) {
    return this.apiClient.request<RestaurantTable[]>('/tables', { headers: authHeaders(token) });
  }

  public createTable(token: string, number: number) {
    return this.apiClient.request<RestaurantTable>('/tables', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ number }),
    });
  }

  public archiveTable(token: string, tableId: string) {
    return this.apiClient.request<void>(tablePath(tableId), { method: 'DELETE', headers: authHeaders(token) });
  }

  public tableOrders(token: string, tableId: string) {
    return this.apiClient.request<TableOrders>(tablePath(tableId) + '/orders', { headers: authHeaders(token) });
  }

  public closedComandas(token: string, date?: string) {
    return this.apiClient.request<ClosedComandaHistory>('/tables/sessions/history' + queryDate(date), {
      headers: authHeaders(token),
    });
  }

  public tableSessions(token: string, tableId: string) {
    return this.apiClient.request<TableSessions>(tablePath(tableId) + '/sessions', { headers: authHeaders(token) });
  }

  public releaseTable(token: string, tableId: string) {
    return this.apiClient.request<ReleaseTableOutput>(tablePath(tableId) + '/release', {
      method: 'PATCH',
      headers: authHeaders(token),
    });
  }

  public removeTableOrder(token: string, tableId: string, orderId: string) {
    return this.apiClient.request<void>(tablePath(tableId) + '/orders/' + encodeURIComponent(orderId), {
      method: 'DELETE',
      headers: authHeaders(token),
    });
  }
}
