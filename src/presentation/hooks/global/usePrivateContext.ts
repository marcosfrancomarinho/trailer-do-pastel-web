import { createContext, useContext } from 'react';
import type { AdminSession } from '../../../application/dtos/auth';
import type { PrivateNotificationsState } from '../admin/usePrivateNotifications';

export type PrivateContext = {
  session: AdminSession | null;
  setSession: (session: AdminSession | null) => void;
  alerts: PrivateNotificationsState;
};

export const PrivateContextProvider = createContext<PrivateContext | null>(null);

export function usePrivateContext(): PrivateContext {
  const context = useContext(PrivateContextProvider);
  if (!context) {
    throw new Error('usePrivateContext precisa estar dentro do layout administrativo.');
  }
  return context;
}
