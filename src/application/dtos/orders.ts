import type { CartItem } from './cart';

export type OrderPayload = {
  customerName: string;
  customerPhone: string;
  observation?: string | null;
  tableId?: string | null;
  items: { productId: string; quantity: number; additions: { additionId: string; quantity: number }[] }[];
};
export type CreatedOrder = { id: string; trackingToken: string; status: string; total: string; tableId?: string | null };
export type TrackedOrder = { status: string; updatedAt: string };
export type PendingOrder = {
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
};

export type OrderHistoryItem = Omit<PendingOrder, 'status'> & {
  status: 'COMPLETED' | 'CANCELED';
  updatedAt: string;
  histories: { status: string; changedAt: string }[];
};

export type PreparingOrder = Omit<PendingOrder, 'status'> & { status: 'CONFIRMED' | 'PREPARING'; updatedAt: string };

export type ActiveOrder = PendingOrder | PreparingOrder;
export type FindCanceledTableOrdersInput = {
  previous: ReadonlyMap<string, ActiveOrder>;
  current: ReadonlyMap<string, ActiveOrder>;
  history: OrderHistoryItem[];
  acknowledgedIds: ReadonlySet<string>;
};

/** Resumo persistido no dispositivo para o cliente consultar sem autenticação. */
export type CustomerOrderDetails = {
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
};
export type SavedCustomerOrder = CreatedOrder & { details?: CustomerOrderDetails };

export type CreateOrderInput = {
  customerName: string;
  customerPhone: string;
  cart: CartItem[];
  observation: string;
};

export type CreateTableOrderInput = CreateOrderInput & { tableId: string };
export type ListOrdersInput = { date?: string };
export type TrackOrderInput = { trackingToken: string; signal?: AbortSignal };
export type UpdateOrderStatusInput = { orderId: string; status: string };
