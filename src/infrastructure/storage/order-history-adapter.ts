import type { OrderHistoryPort } from '../../application/ports/order-port'
import { readOrders, saveOrder } from './order-storage'
export const orderHistoryAdapter: OrderHistoryPort = { list: readOrders, save: saveOrder }
