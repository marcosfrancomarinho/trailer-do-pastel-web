import type { CatalogPort } from './ports/catalog-port'
import type { OrderHistoryPort, OrderPort } from './ports/order-port'
import type { OrderPayload } from '../domain/models'
export class RestaurantUseCases {
  constructor(private readonly catalog: CatalogPort, private readonly orders: OrderPort, private readonly history: OrderHistoryPort) {}
  catalogList() { return Promise.all([this.catalog.categories(), this.catalog.products()]) }
  additions(id: string) { return this.catalog.additions(id) }
  listRecords(kind: 'products' | 'additions' | 'categories') { return kind === 'products' ? this.catalog.products() : kind === 'additions' ? this.catalog.allAdditions() : this.catalog.categories() }
  createRecord(kind: 'products' | 'additions' | 'categories' | 'users', token: string, data: unknown) { return this.catalog.createCatalog(kind, token, data) }
  updateRecord(kind: 'products' | 'additions' | 'categories', id: string, token: string, data: unknown) { return this.catalog.update(kind, id, token, data) }
  removeRecord(kind: 'products' | 'additions' | 'categories', id: string, token: string) { return this.catalog.remove(kind, id, token) }
  async createOrder(data: OrderPayload) { const order = await this.orders.create(data); this.history.save(order); return order }
  recentOrders() { return this.history.list() }
  pendingOrders(token: string) { return this.orders.pending(token) }
  preparingOrders(token: string) { return this.orders.preparing(token) }
  orderHistory(token: string) { return this.orders.history(token) }
  track(token: string) { return this.orders.tracking(token) }
  updateOrderStatus(token: string, id: string, status: string) { return this.orders.changeStatus(token,id,status) }
}
