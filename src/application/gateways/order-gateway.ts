import type { CreatedOrder, OrderPayload, PendingOrder, PreparingOrder, OrderHistoryItem, TrackedOrder } from '../dtos/orders';

export interface OrderGateway {
  create(data: OrderPayload, token?: string): Promise<CreatedOrder>;
  pending(token: string, date?: string): Promise<PendingOrder[]>;
  preparing(token: string, date?: string): Promise<PreparingOrder[]>;
  history(token: string, date?: string): Promise<OrderHistoryItem[]>;
  tracking(trackingToken: string, signal?: AbortSignal): Promise<TrackedOrder>;
  changeStatus(token: string, id: string, status: string): Promise<void>;
}
