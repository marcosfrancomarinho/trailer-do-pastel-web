import type { OrderHistoryPort } from '../../application/ports/order-port'
import { readOrders, saveOrder, removeOrder } from './order-storage'
export const orderHistoryAdapter: OrderHistoryPort = { list: readOrders, save: saveOrder, remove: removeOrder }
