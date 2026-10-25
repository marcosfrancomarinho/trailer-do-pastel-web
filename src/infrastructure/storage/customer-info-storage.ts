import type { CustomerInfo, CustomerInfoGateway } from '../../application/gateways/customer-info-gateway';

export class CustomerInfoStorageAdapter implements CustomerInfoGateway {
  private key = 'trailer-pastel-customer-info';

  public get(): CustomerInfo {
    try {
      const stored = window.localStorage.getItem(this.key);
      if (!stored) return { name: '', phone: '' };
      const parsed: unknown = JSON.parse(stored);
      if (typeof parsed !== 'object' || parsed === null) return { name: '', phone: '' };
      const info = parsed as Record<string, unknown>;
      return {
        name: typeof info.name === 'string' ? info.name : '',
        phone: typeof info.phone === 'string' ? info.phone : '',
      };
    } catch {
      return { name: '', phone: '' };
    }
  }

  public save(info: CustomerInfo): void {
    try {
      window.localStorage.setItem(this.key, JSON.stringify(info));
    } catch {
      // O pedido continua funcionando se o armazenamento estiver bloqueado.
    }
  }
}
