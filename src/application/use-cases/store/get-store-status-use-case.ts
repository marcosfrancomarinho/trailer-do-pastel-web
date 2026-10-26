import type { StoreGateway } from '../../gateways/store-gateway';
import type { GetStoreStatusOutput } from '../../dtos/store';

export class GetStoreStatusUseCase {
  private store: StoreGateway;

  public constructor(store: StoreGateway) {
    this.store = store;
  }

  public execute(): Promise<GetStoreStatusOutput> {
    const statusRequest = this.store.storeStatus();
    return statusRequest;
  }
}
