import type { Addition, Product } from './catalog'

export type CartItem = {
  key: string
  product: Product
  quantity: number
  additions: { addition: Addition; quantity: number }[]
}

export type AddCartItemInput = {
  cart: CartItem[]
  product: Product
  additions: Addition[]
  amounts: Record<string, number>
  quantity: number
}
