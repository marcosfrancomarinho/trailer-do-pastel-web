import type { OrderHistoryGateway } from '../../application/gateways/order-history-gateway';
import type { SavedCustomerOrder } from '../../application/dtos/orders';

export class OrderHistoryStorageAdapter implements OrderHistoryGateway {
  private key = 'pastel-orders';
  private legacyKey = 'pastel-order';

  public list(): SavedCustomerOrder[] {
    try {
      const stored = JSON.parse(localStorage.getItem(this.key) || 'null') as unknown;
      if (Array.isArray(stored)) {
        return stored.filter((value): value is SavedCustomerOrder =>
          Boolean(value && typeof value === 'object' && 'trackingToken' in value),
        );
      }

      // Migração única: não resgata o pedido legado depois que o usuário o excluiu.
      const legacy = localStorage.getItem(this.legacyKey);
      if (!legacy) return [];
      const parsed = JSON.parse(legacy) as SavedCustomerOrder;
      const migrated = parsed?.trackingToken ? [parsed] : [];
      localStorage.setItem(this.key, JSON.stringify(migrated));
      localStorage.removeItem(this.legacyKey);
      return migrated;
    } catch {
      return [];
    }
  }

  public save(order: SavedCustomerOrder): SavedCustomerOrder[] {
    const existing = this.list();
    const all = [order, ...existing.filter((saved) => saved.trackingToken !== order.trackingToken)];
    localStorage.setItem(this.key, JSON.stringify(all));
    return all;
  }

  /** Apaga apenas o histórico deste navegador, nunca o pedido do servidor. */
  public remove(trackingToken: string): SavedCustomerOrder[] {
    const existing = this.list();
    const remaining = existing.filter((order) => order.trackingToken !== trackingToken);
    localStorage.setItem(this.key, JSON.stringify(remaining));
    localStorage.removeItem(this.legacyKey);
    return remaining;
  }
}
