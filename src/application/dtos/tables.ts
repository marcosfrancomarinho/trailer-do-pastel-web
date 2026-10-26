import type { PendingOrder } from './orders';

export interface RestaurantTable { id: string; number: number; status: 'FREE' | 'OCCUPIED'; totalSpent: string }
export type TableOrder = PendingOrder & { updatedAt: string; createdBy?: { name: string; role: 'ADMIN' | 'EMPLOYEE' } | null };
export interface TableOrders {
  tableId: string;
  number: number;
  status: 'FREE' | 'OCCUPIED';
  totalSpent: string;
  sessionId: string | null;
  orders: TableOrder[];
}
export interface TableSession {
  id: string;
  openedAt: string;
  closedAt: string | null;
  closedTotal: string | null;
  orders: TableOrder[];
}
export interface TableSessions { tableId: string; sessions: TableSession[] }

export interface ClosedComanda {
  tableId: string | null;
  tableNumber: number | null;
  origin: 'TABLE' | 'ONLINE';
  session: TableSession;
}
export interface ClosedComandaHistory { comandas: ClosedComanda[] }

export interface TableIdInput { tableId: string }
export interface CreateTableInput { number: number }
export type RemoveTableOrderInput = TableIdInput & { orderId: string };
export interface ListClosedComandasInput { date?: string }

export interface ReleaseTableOutput { id: string; status: 'FREE'; closedTotal: string }
export interface TableReleaseStatusOutput { table: TableOrders; unfinishedCount: number }
export type ListTablesOutput = RestaurantTable[];
export interface ListTableOverviewOutput { tables: RestaurantTable[]; readyTableIds: Set<string> }
export type CreateTableOutput = RestaurantTable;
export type ListTableOrdersOutput = TableOrders;
export type ListTableSessionsOutput = TableSessions;
export type ListClosedComandasOutput = ClosedComandaHistory;
