import { createContext, useContext } from 'react';
import type { AdminSession } from '../../../application/dtos/auth';
import type { usePrivateNotifications } from '../admin/usePrivateNotifications';

export type PrivateContext = {
  session: AdminSession | null;
  setSession: (session: AdminSession | null) => void;
  alerts: ReturnType<typeof usePrivateNotifications>;
};

export const PrivateContextProvider = createContext<PrivateContext | null>(null);

export function usePrivateContext() {
  const context = useContext(PrivateContextProvider);
  if (!context) throw new Error('usePrivateContext precisa estar dentro do layout administrativo.');
  return context;
}
