import { api } from './api-client'
import type { CatalogPort } from '../../application/ports/catalog-port'
import type { OrderPort } from '../../application/ports/order-port'
import type { Addition, Category, CreatedOrder, OrderPayload, PendingOrder, OrderHistoryItem, Product, TrackedOrder } from '../../domain/models'
const auth = (token: string) => ({ Authorization: 'Bearer ' + token })
export class RestaurantHttpAdapter implements CatalogPort, OrderPort {
  categories() { return api<Category[]>('/categories') }
  products() { return api<Product[]>('/products') }
  additions(id: string) { return api<Addition[]>('/products/' + encodeURIComponent(id) + '/additions') }
  allAdditions() { return api<Addition[]>('/additions') }
  create(data: OrderPayload) { return api<CreatedOrder>('/orders', { method: 'POST', body: JSON.stringify(data) }) }
  pending(token: string) { return api<PendingOrder[]>('/orders/pending', { headers: auth(token) }) }
  history(token: string) { return api<OrderHistoryItem[]>('/orders/history', { headers: auth(token) }) }
  tracking(token: string) { return api<TrackedOrder>('/orders/tracking/' + encodeURIComponent(token)) }
  async changeStatus(token: string, id: string, status: string) { await api('/orders/' + encodeURIComponent(id) + '/status', { method: 'PATCH', headers: auth(token), body: JSON.stringify({status}) }) }
  async update(kind: 'products' | 'additions' | 'categories', id: string, token: string, data: unknown) { await api('/' + kind + '/' + encodeURIComponent(id), { method: 'PATCH', headers: auth(token), body: JSON.stringify(data) }) }
  async remove(kind: 'products' | 'additions' | 'categories', id: string, token: string) { await api('/' + kind + '/' + encodeURIComponent(id), { method: 'DELETE', headers: auth(token) }) }
  async createCatalog(kind: 'products' | 'additions' | 'categories' | 'users', token: string, data: unknown) { await api('/' + kind, { method: 'POST', headers: auth(token), body: JSON.stringify(data) }) }
}
export const restaurantAdapter = new RestaurantHttpAdapter()
