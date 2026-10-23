import { restaurant } from './container'
export const trackOrder = (token: string, signal?: AbortSignal) => restaurant.track(token, signal)
export const listPendingOrders = (token: string) => restaurant.pendingOrders(token)
export const updateOrderStatus = (token: string, id: string, status: string) => restaurant.updateOrderStatus(token, id, status)
