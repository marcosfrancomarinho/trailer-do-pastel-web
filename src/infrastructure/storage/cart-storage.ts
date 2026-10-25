import type { CartItem } from '../../application/dtos/cart';
import type { CartGateway } from '../../application/gateways/cart-gateway';

export class CartStorageAdapter implements CartGateway {
  private key = 'trailer-pastel-cart-v1';

  /** Recupera o carrinho do próprio navegador após atualizar ou reabrir a página. */
  public get(): CartItem[] {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((value): value is CartItem => this.isCartItem(value)) : [];
    } catch {
      return [];
    }
  }

  /** Remove os itens armazenados somente quando o carrinho ficar vazio. */
  public save(items: CartItem[]): void {
    try {
      if (items.length === 0) localStorage.removeItem(this.key);
      else localStorage.setItem(this.key, JSON.stringify(items));
    } catch {
      // O carrinho continua disponível em memória se o armazenamento estiver bloqueado.
    }
  }

  private positiveInteger(value: unknown): value is number {
    return Number.isSafeInteger(value) && typeof value === 'number' && value > 0;
  }

  private validPrice(value: unknown): value is string {
    return typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;
  }

  private isCartItem(value: unknown): value is CartItem {
    if (!value || typeof value !== 'object') return false;
    const item = value as Partial<CartItem>;
    if (typeof item.key !== 'string' || !item.key || !this.positiveInteger(item.quantity)) return false;

    const product = item.product;
    if (
      !product ||
      typeof product.id !== 'string' ||
      !product.id ||
      typeof product.name !== 'string' ||
      !this.validPrice(product.price)
    )
      return false;

    return (
      Array.isArray(item.additions) &&
      item.additions.every(
        (extra) =>
          extra !== null &&
          typeof extra === 'object' &&
          this.positiveInteger(extra.quantity) &&
          extra.addition !== null &&
          typeof extra.addition === 'object' &&
          typeof extra.addition.id === 'string' &&
          extra.addition.id.length > 0 &&
          typeof extra.addition.name === 'string' &&
          this.validPrice(extra.addition.price),
      )
    );
  }
}
