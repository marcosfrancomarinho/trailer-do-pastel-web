import { useEffect, useState } from 'react';
import type { StoreState } from '../../../application/dtos/store';
import { useApplicationServices } from '../global/useApplicationServices';

export function useStoreStatus() {
  const useCases = useApplicationServices();
  const [storeState, setStoreState] = useState<StoreState | null>(null);

  useEffect(() => {
    let active = true;

    const updateStatus = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const currentStatus = await useCases.store.getStatus.execute();
        if (active) setStoreState(currentStatus);
      } catch {
        // Mantém o último estado conhecido quando a consulta falha.
      }
    };

    const refreshStatus = () => { void updateStatus(); };
    refreshStatus();
    const timer = window.setInterval(refreshStatus, 30_000);
    window.addEventListener('focus', refreshStatus);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshStatus);
    };
  }, [useCases]);

  return storeState;
}
