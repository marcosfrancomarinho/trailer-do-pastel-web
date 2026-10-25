import type { CartGateway } from '../../gateways/cart-gateway'

export class GetCartUseCase {
  private cart: CartGateway

  public constructor(cart: CartGateway) {
    this.cart = cart
  }

  public execute() {
    return this.cart.get()
  }
}
