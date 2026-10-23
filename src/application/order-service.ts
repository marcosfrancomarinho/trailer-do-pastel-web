import { api } from '../infrastructure/http/api-client'
import type { CreatedOrder, TrackedOrder, PendingOrder } from '../domain/models'
export const trackOrder = (token: string) => api<TrackedOrder>('/orders/tracking/' + encodeURIComponent(token))
export const listPendingOrders = (token: string) => api<PendingOrder[]>('/orders/pending', { headers: { Authorization: 'Bearer ' + token } })
export const updateOrderStatus = (token: string, id: string, status: string) =>
  api<{ id: string; status: string }>('/orders/' + encodeURIComponent(id) + '/status', {
    method: 'PATCH', headers: { Authorization: 'Bearer ' + token }, body: JSON.stringify({ status }),
  })
