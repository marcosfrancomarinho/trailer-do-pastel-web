import { api } from './api-client'
import type { CatalogPort } from '../../application/ports/catalog-port'
import type { OrderPort } from '../../application/ports/order-port'
import type { Addition, Category, CreatedOrder, OrderPayload, PendingOrder, PreparingOrder, OrderHistoryItem, Product, TrackedOrder, StoreState, RestaurantTable, TableOrders, TableSessions, RestaurantUser } from '../../domain/models'
const auth = (token: string) => ({ Authorization: 'Bearer ' + token })
const queryDate = (date?: string) => date ? '?date=' + encodeURIComponent(date) : ''
export class RestaurantHttpAdapter implements CatalogPort, OrderPort {
  categories() { return api<Category[]>('/categories') }
  products() { return api<Product[]>('/products') }
  additions(id: string) { return api<Addition[]>('/products/' + encodeURIComponent(id) + '/additions') }
  allAdditions() { return api<Addition[]>('/additions') }
  create(data: OrderPayload, token?: string) {
    return api<CreatedOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
      ...(token ? { headers: auth(token) } : {}),
    })
  }
  storeStatus() { return api<StoreState>('/store/status') }
  setStoreOpen(token: string, open: boolean) { return api<StoreState>(open ? '/store/open' : '/store/close', { method: 'POST', headers: auth(token) }) }
  tables(token: string) { return api<RestaurantTable[]>('/tables', { headers: auth(token) }) }
  createTable(token: string, number: number) { return api<RestaurantTable>('/tables', { method: 'POST', headers: auth(token), body: JSON.stringify({ number }) }) }
  tableOrders(token: string, tableId: string) { return api<TableOrders>('/tables/' + encodeURIComponent(tableId) + '/orders', { headers: auth(token) }) }
  tableSessions(token: string, tableId: string) { return api<TableSessions>('/tables/' + encodeURIComponent(tableId) + '/sessions', { headers: auth(token) }) }
  releaseTable(token: string, tableId: string) { return api<{ id: string; status: 'FREE'; closedTotal: string }>('/tables/' + encodeURIComponent(tableId) + '/release', { method: 'PATCH', headers: auth(token) }) }
  removeTableOrder(token: string, tableId: string, orderId: string) { return api('/tables/' + encodeURIComponent(tableId) + '/orders/' + encodeURIComponent(orderId), { method: 'DELETE', headers: auth(token) }) }
  users(token: string) { return api<RestaurantUser[]>('/users', { headers: auth(token) }) }
  removeUser(token: string, userId: string) { return api('/users/' + encodeURIComponent(userId), { method: 'DELETE', headers: auth(token) }) }
  pending(token: string, date?: string) { return api<PendingOrder[]>('/orders/pending' + queryDate(date), { headers: auth(token) }) }
  preparing(token: string, date?: string) { return api<PreparingOrder[]>('/orders/preparing' + queryDate(date), { headers: auth(token) }) }
  history(token: string, date?: string) { return api<OrderHistoryItem[]>('/orders/history' + queryDate(date), { headers: auth(token) }) }
  tracking(token: string, signal?: AbortSignal) { return api<TrackedOrder>('/orders/tracking/' + encodeURIComponent(token), { signal }) }
  async changeStatus(token: string, id: string, status: string) { await api('/orders/' + encodeURIComponent(id) + '/status', { method: 'PATCH', headers: auth(token), body: JSON.stringify({status}) }) }
  async update(kind: 'products' | 'additions' | 'categories', id: string, token: string, data: unknown) { await api('/' + kind + '/' + encodeURIComponent(id), { method: 'PATCH', headers: auth(token), body: JSON.stringify(data) }) }
  async remove(kind: 'products' | 'additions' | 'categories', id: string, token: string) { await api('/' + kind + '/' + encodeURIComponent(id), { method: 'DELETE', headers: auth(token) }) }
  async createCatalog(kind: 'products' | 'additions' | 'categories' | 'users', token: string, data: unknown) { await api('/' + kind, { method: 'POST', headers: auth(token), body: JSON.stringify(data) }) }
}
export const restaurantAdapter = new RestaurantHttpAdapter()
