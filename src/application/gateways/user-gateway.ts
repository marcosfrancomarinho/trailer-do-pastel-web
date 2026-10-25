import type { RestaurantUser } from '../dtos/users'

export interface UserGateway {
  users(token: string): Promise<RestaurantUser[]>
  createUser(token: string, data: { name: string; password: string }): Promise<void>
  removeUser(token: string, userId: string): Promise<void>
}
