import type { StoreGateway } from '../../gateways/store-gateway';

export class GetStoreStatusUseCase {
  private store: StoreGateway;

  public constructor(store: StoreGateway) {
    this.store = store;
  }

  public execute() {
    return this.store.storeStatus();
  }
}
