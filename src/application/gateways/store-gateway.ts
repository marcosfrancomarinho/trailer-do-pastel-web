import type { StoreState } from '../dtos/store';

export interface StoreGateway {
  storeStatus(): Promise<StoreState>;
  setStoreOpen(token: string, open: boolean): Promise<StoreState>;
}
