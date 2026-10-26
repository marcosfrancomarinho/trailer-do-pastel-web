import { createContext, useContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { CartItem } from '../../../application/dtos/cart';
import type { StoreState } from '../../../application/dtos/store';

export type PublicContext = {
  cart: CartItem[];
  setCart: Dispatch<SetStateAction<CartItem[]>>;
  storeState: StoreState | null;
};

export const PublicContextProvider = createContext<PublicContext | null>(null);

export function usePublicContext(): PublicContext {
  const context = useContext(PublicContextProvider);
  if (!context) {
    throw new Error('usePublicContext precisa estar dentro do layout público.');
  }
  return context;
}
