import { restaurantAdapter } from '../infrastructure/http/restaurant-adapter'
import { orderHistoryAdapter } from '../infrastructure/storage/order-history-adapter'
import { RestaurantUseCases } from './restaurant-use-cases'
export const restaurant = new RestaurantUseCases(restaurantAdapter, restaurantAdapter, orderHistoryAdapter)
