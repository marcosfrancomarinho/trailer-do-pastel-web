import type { Addition, Product } from './catalog'

export interface CartItem {
  key: string
  product: Product
  quantity: number
  additions: { addition: Addition; quantity: number }[]
}

export interface AddCartItemInput {
  cart: CartItem[]
  product: Product
  additions: Addition[]
  amounts: Record<string, number>
  quantity: number
}

export type AddCartItemOutput = CartItem[]
export type GetCartOutput = CartItem[]
