import type { CartItem } from '../dtos/cart';
import type { OrderPayload } from '../dtos/orders';

export class OrderPayloadMapper {
  public static map(name: string, phone: string, cart: CartItem[]): OrderPayload {
    const customerName = name.trim();
    const customerPhone = phone.replace(/[\s()-]/g, '');

    if (!customerName) throw new Error('Informe seu nome.');
    if (!/^\d{10,11}$/.test(customerPhone)) throw new Error('Informe um telefone com DDD válido.');
    if (!cart.length) throw new Error('Adicione pelo menos um produto.');

    return {
      customerName,
      customerPhone,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        additions: item.additions.map((extra) => ({
          additionId: extra.addition.id,
          quantity: extra.quantity,
        })),
      })),
    };
  }
}
