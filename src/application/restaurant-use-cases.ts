import type { CatalogPort } from './ports/catalog-port'
import type { OrderHistoryPort, OrderPort } from './ports/order-port'
import type { CustomerOrderDetails, OrderPayload } from '../domain/models'
export class RestaurantUseCases {
  constructor(private readonly catalog: CatalogPort, private readonly orders: OrderPort, private readonly history: OrderHistoryPort) {}
  catalogList() { return Promise.all([this.catalog.categories(), this.catalog.products()]) }
  additions(id: string) { return this.catalog.additions(id) }
  listRecords(kind: 'products' | 'additions' | 'categories') { return kind === 'products' ? this.catalog.products() : kind === 'additions' ? this.catalog.allAdditions() : this.catalog.categories() }
  createRecord(kind: 'products' | 'additions' | 'categories' | 'users', token: string, data: unknown) { return this.catalog.createCatalog(kind, token, data) }
  updateRecord(kind: 'products' | 'additions' | 'categories', id: string, token: string, data: unknown) { return this.catalog.update(kind, id, token, data) }
  removeRecord(kind: 'products' | 'additions' | 'categories', id: string, token: string) { return this.catalog.remove(kind, id, token) }
  async createOrder(data: OrderPayload, details?: CustomerOrderDetails) {
    const order = await this.orders.create(data)
    this.history.save({ ...order, details })
    return order
  }
  recentOrders() { return this.history.list() }
  removeSavedOrder(token: string) { return this.history.remove(token) }
  pendingOrders(token: string, date?: string) { return this.orders.pending(token, date) }
  preparingOrders(token: string, date?: string) { return this.orders.preparing(token, date) }
  orderHistory(token: string, date?: string) { return this.orders.history(token, date) }
  track(token: string, signal?: AbortSignal) { return this.orders.tracking(token, signal) }
  updateOrderStatus(token: string, id: string, status: string) { return this.orders.changeStatus(token,id,status) }
}
