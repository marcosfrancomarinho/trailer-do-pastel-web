import type { CartItem } from '../dtos/cart';

export class CartTotal {
  public static calculate(cart: CartItem[]): number {
    return cart.reduce((total, item) => {
      const additionsTotal = item.additions.reduce((price, extra) => price + Number(extra.addition.price) * extra.quantity, 0);
      return total + item.quantity * (Number(item.product.price) + additionsTotal);
    }, 0);
  }
}
