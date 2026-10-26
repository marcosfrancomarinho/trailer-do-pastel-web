export interface StoreState { status: 'OPEN' | 'CLOSED'; updatedAt: string }

export interface ChangeStoreStatusInput { open: boolean }
export type GetStoreStatusOutput = StoreState;
export type ChangeStoreStatusOutput = StoreState;
