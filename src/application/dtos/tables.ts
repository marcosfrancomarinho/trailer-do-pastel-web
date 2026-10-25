import type { PendingOrder } from './orders';

export type RestaurantTable = { id: string; number: number; status: 'FREE' | 'OCCUPIED'; totalSpent: string };
export type TableOrder = PendingOrder & { updatedAt: string; createdBy?: { name: string; role: 'ADMIN' | 'EMPLOYEE' } | null };
export type TableOrders = {
  tableId: string;
  number: number;
  status: 'FREE' | 'OCCUPIED';
  totalSpent: string;
  sessionId: string | null;
  orders: TableOrder[];
};
export type TableSession = {
  id: string;
  openedAt: string;
  closedAt: string | null;
  closedTotal: string | null;
  orders: TableOrder[];
};
export type TableSessions = { tableId: string; sessions: TableSession[] };

export type ClosedComanda = {
  tableId: string | null;
  tableNumber: number | null;
  origin: 'TABLE' | 'ONLINE';
  session: TableSession;
};
export type ClosedComandaHistory = { comandas: ClosedComanda[] };

export type TableIdInput = { tableId: string };
export type CreateTableInput = { number: number };
export type RemoveTableOrderInput = TableIdInput & { orderId: string };
export type ListClosedComandasInput = { date?: string };

export type ReleaseTableOutput = { id: string; status: 'FREE'; closedTotal: string };
export type TableReleaseStatusOutput = { table: TableOrders; unfinishedCount: number };
