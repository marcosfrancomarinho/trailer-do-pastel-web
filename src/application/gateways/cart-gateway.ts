import type { CartItem } from '../dtos/cart'

export interface CartGateway {
  get(): CartItem[]
  save(items: CartItem[]): void
}
