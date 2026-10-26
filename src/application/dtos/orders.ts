import type { CartItem } from './cart';

export interface OrderPayload {
  customerName: string;
  customerPhone: string;
  observation?: string | null;
  tableId?: string | null;
  items: { productId: string; quantity: number; additions: { additionId: string; quantity: number }[] }[];
}
export interface CreatedOrder { id: string; trackingToken: string; status: string; total: string; tableId?: string | null }
export interface TrackedOrder { status: string; updatedAt: string }
export interface PendingOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  observation?: string | null;
  tableId?: string | null;
  tableNumber?: number | null;
  status: string;
  total: string;
  createdAt: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: string;
    additions: { additionName: string; quantity: number; unitPrice: string }[];
  }[];
}

export type OrderHistoryItem = Omit<PendingOrder, 'status'> & {
  status: 'COMPLETED' | 'CANCELED';
  updatedAt: string;
  histories: { status: string; changedAt: string }[];
};

export type PreparingOrder = Omit<PendingOrder, 'status'> & { status: 'CONFIRMED' | 'PREPARING'; updatedAt: string };

export type ActiveOrder = PendingOrder | PreparingOrder;
export interface FindCanceledTableOrdersInput {
  previous: ReadonlyMap<string, ActiveOrder>;
  current: ReadonlyMap<string, ActiveOrder>;
  history: OrderHistoryItem[];
  acknowledgedIds: ReadonlySet<string>;
}

/** Resumo persistido no dispositivo para o cliente consultar sem autenticação. */
export interface CustomerOrderDetails {
  customerName: string;
  customerPhone: string;
  observation?: string | null;
  createdAt: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: string;
    additions: { additionName: string; quantity: number; unitPrice: string }[];
  }[];
}
export type SavedCustomerOrder = CreatedOrder & { details?: CustomerOrderDetails };

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  cart: CartItem[];
  observation: string;
}

export type CreateTableOrderInput = CreateOrderInput & { tableId: string };
export interface ListOrdersInput { date?: string }
export interface TrackOrderInput { trackingToken: string; signal?: AbortSignal }
export interface UpdateOrderStatusInput { orderId: string; status: string }

export type CreateOrderOutput = CreatedOrder;
export type CreateTableOrderOutput = CreatedOrder;
export type FindCanceledTableOrdersOutput = ActiveOrder[];
export type ListOrderHistoryOutput = OrderHistoryItem[];
export type ListPendingOrdersOutput = PendingOrder[];
export type ListPreparingOrdersOutput = PreparingOrder[];
export type ListSavedOrdersOutput = SavedCustomerOrder[];
export type RemoveSavedOrderOutput = SavedCustomerOrder[];
export type TrackOrderOutput = TrackedOrder;
