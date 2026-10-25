import type { SavedCustomerOrder } from '../dtos/orders'

export interface OrderHistoryGateway {
  list(): SavedCustomerOrder[]
  save(order: SavedCustomerOrder): SavedCustomerOrder[]
  remove(trackingToken: string): SavedCustomerOrder[]
}
