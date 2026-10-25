import type { ClosedComandaHistory, RestaurantTable, TableOrders, TableSessions, ReleaseTableOutput } from '../dtos/tables'

export interface TableGateway {
  tables(token: string): Promise<RestaurantTable[]>
  createTable(token: string, number: number): Promise<RestaurantTable>
  archiveTable(token: string, tableId: string): Promise<void>
  tableOrders(token: string, tableId: string): Promise<TableOrders>
  closedComandas(token: string, date?: string): Promise<ClosedComandaHistory>
  tableSessions(token: string, tableId: string): Promise<TableSessions>
  releaseTable(token: string, tableId: string): Promise<ReleaseTableOutput>
  removeTableOrder(token: string, tableId: string, orderId: string): Promise<void>
}
