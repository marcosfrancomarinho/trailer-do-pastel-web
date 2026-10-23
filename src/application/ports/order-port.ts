import type { CreatedOrder, OrderPayload, PendingOrder, PreparingOrder, OrderHistoryItem, TrackedOrder } from '../../domain/models'
export interface OrderPort {
  create(data: OrderPayload): Promise<CreatedOrder>
  pending(token: string): Promise<PendingOrder[]>
  preparing(token: string): Promise<PreparingOrder[]>
  history(token: string): Promise<OrderHistoryItem[]>
  tracking(trackingToken: string): Promise<TrackedOrder>
  changeStatus(token: string, id: string, status: string): Promise<void>
}
export interface OrderHistoryPort {
  list(): CreatedOrder[]
  save(order: CreatedOrder): CreatedOrder[]
}
