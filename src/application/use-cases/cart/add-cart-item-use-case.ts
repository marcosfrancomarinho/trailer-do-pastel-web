import type { AddCartItemInput, AddCartItemOutput, CartItem } from '../../dtos/cart';
import { ValidationError } from '../../errors/validation-error.ts';

export class AddCartItemUseCase {
  public execute(input: AddCartItemInput): AddCartItemOutput {
    this.validateProductAndQuantity(input);

    const selectedAdditions = this.selectAdditions(input);
    const key = this.buildItemKey(input.product.id, selectedAdditions);
    const hasMatchingItem = input.cart.some((item) => item.key === key);

    if (hasMatchingItem) {
      const updatedCart = input.cart.map((item) => {
        if (item.key !== key) return item;

        const updatedItem = { ...item, quantity: item.quantity + input.quantity };
        return updatedItem;
      });
      return updatedCart;
    }

    const newItem: CartItem = {
      key,
      product: input.product,
      quantity: input.quantity,
      additions: selectedAdditions,
    };
    const updatedCart = [...input.cart, newItem];
    return updatedCart;
  }

  private validateProductAndQuantity(input: AddCartItemInput): void {
    if (!input.product.available) {
      throw new ValidationError('product', 'Produto indisponível.');
    }
    if (!Number.isSafeInteger(input.quantity) || input.quantity < 1) {
      throw new ValidationError('quantity', 'Quantidade deve ser maior que zero.');
    }
  }

  private selectAdditions(input: AddCartItemInput): CartItem['additions'] {
    const selectedAdditions: CartItem['additions'] = [];

    for (const addition of input.additions) {
      const amount = input.amounts[addition.id] ?? 0;
      const isSelected = amount > 0;
      if (!addition.available || !isSelected) continue;

      if (!Number.isSafeInteger(amount)) {
        throw new ValidationError('amounts', 'Quantidade de adicional deve ser inteira.');
      }
      selectedAdditions.push({ addition, quantity: amount });
    }

    return selectedAdditions;
  }

  private buildItemKey(productId: string, additions: CartItem['additions']): string {
    // A ordem dos adicionais não altera a identidade do item.
    const additionKeys = additions.map(({ addition, quantity }) => `${addition.id}-${quantity}`);
    additionKeys.sort();
    const key = `${productId}:${additionKeys.join(',')}`;
    return key;
  }
}
