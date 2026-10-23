import { api } from './api-client'
import type { CatalogPort } from '../../application/ports/catalog-port'
import type { OrderPort } from '../../application/ports/order-port'
import type { Addition, Category, CreatedOrder, OrderPayload, PendingOrder, PreparingOrder, OrderHistoryItem, Product, TrackedOrder } from '../../domain/models'
const auth = (token: string) => ({ Authorization: 'Bearer ' + token })
const queryDate = (date?: string) => date ? '?date=' + encodeURIComponent(date) : ''
export class RestaurantHttpAdapter implements CatalogPort, OrderPort {
  categories() { return api<Category[]>('/categories') }
  products() { return api<Product[]>('/products') }
  additions(id: string) { return api<Addition[]>('/products/' + encodeURIComponent(id) + '/additions') }
  allAdditions() { return api<Addition[]>('/additions') }
  create(data: OrderPayload) { return api<CreatedOrder>('/orders', { method: 'POST', body: JSON.stringify(data) }) }
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
