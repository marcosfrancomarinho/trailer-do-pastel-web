import type { CreatedOrder, OrderPayload, PendingOrder, PreparingOrder, OrderHistoryItem, TrackedOrder, SavedCustomerOrder } from '../../domain/models'
export interface OrderPort {
  create(data: OrderPayload): Promise<CreatedOrder>
  pending(token: string, date?: string): Promise<PendingOrder[]>
  preparing(token: string, date?: string): Promise<PreparingOrder[]>
  history(token: string, date?: string): Promise<OrderHistoryItem[]>
  tracking(trackingToken: string): Promise<TrackedOrder>
  changeStatus(token: string, id: string, status: string): Promise<void>
}
export interface OrderHistoryPort {
  list(): SavedCustomerOrder[]
  save(order: SavedCustomerOrder): SavedCustomerOrder[]
  remove(trackingToken: string): SavedCustomerOrder[]
}
