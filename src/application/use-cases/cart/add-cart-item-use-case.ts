import type { AddCartItemInput, CartItem } from '../../dtos/cart';
import { ValidationError } from '../../errors/validation-error.ts';

export class AddCartItemUseCase {
  public execute(input: AddCartItemInput): CartItem[] {
    if (!input.product.available) throw new ValidationError('product', 'Produto indisponível.');
    if (!Number.isSafeInteger(input.quantity) || input.quantity < 1) {
      throw new ValidationError('quantity', 'Quantidade deve ser maior que zero.');
    }

    const selectedAdditions: CartItem['additions'] = [];
    for (const addition of input.additions) {
      const amount = input.amounts[addition.id] ?? 0;
      if (!addition.available || !(amount > 0)) continue;

      if (!Number.isSafeInteger(amount)) {
        throw new ValidationError('amounts', 'Quantidade de adicional deve ser inteira.');
      }
      selectedAdditions.push({ addition, quantity: amount });
    }

    // A ordem dos adicionais não altera a identidade do item.
    const additionKeys = selectedAdditions.map(({ addition, quantity }) => `${addition.id}-${quantity}`).sort();
    const key = `${input.product.id}:${additionKeys.join(',')}`;

    const alreadyInCart = input.cart.some((item) => item.key === key);
    if (!alreadyInCart) {
      return [...input.cart, { key, product: input.product, quantity: input.quantity, additions: selectedAdditions }];
    }

    return input.cart.map((item) =>
      item.key === key ? { ...item, quantity: item.quantity + input.quantity } : item,
    );
  }
}
