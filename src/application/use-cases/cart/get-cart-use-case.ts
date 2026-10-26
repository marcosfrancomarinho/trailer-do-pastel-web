import type { CartGateway } from '../../gateways/cart-gateway'
import type { GetCartOutput } from '../../dtos/cart'

export class GetCartUseCase {
  private cart: CartGateway

  public constructor(cart: CartGateway) {
    this.cart = cart
  }

  public execute(): GetCartOutput {
    const cart = this.cart.get()
    return cart
  }
}
