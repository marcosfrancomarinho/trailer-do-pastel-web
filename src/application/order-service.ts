import { restaurant } from './container'
export const trackOrder = (token: string) => restaurant.track(token)
export const listPendingOrders = (token: string) => restaurant.pendingOrders(token)
export const updateOrderStatus = (token: string, id: string, status: string) => restaurant.updateOrderStatus(token, id, status)
