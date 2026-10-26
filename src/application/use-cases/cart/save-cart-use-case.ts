import { SaveCart } from '../../validation/cart/save-cart.ts';
import type { CartItem } from '../../dtos/cart';
import type { CartGateway } from '../../gateways/cart-gateway';

export class SaveCartUseCase {
  private cart: CartGateway;

  public constructor(cart: CartGateway) {
    this.cart = cart;
  }

  public execute(items: CartItem[]): void {
    const validatedInput = SaveCart.validate(items);
    this.cart.save(validatedInput);
  }
}
