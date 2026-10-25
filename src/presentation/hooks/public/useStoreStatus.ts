import { useEffect, useState } from 'react';
import type { StoreState } from '../../../application/dtos/store';
import { useApplicationServices } from '../global/useApplicationServices';

export function useStoreStatus() {
  const useCases = useApplicationServices();
  const [storeState, setStoreState] = useState<StoreState | null>(null);

  useEffect(() => {
    let active = true;

    const updateStatus = () => {
      if (document.visibilityState === 'hidden') return;
      void useCases.store.getStatus
        .execute()
        .then((value) => {
          if (active) setStoreState(value);
        })
        .catch(() => {});
    };

    updateStatus();
    const timer = window.setInterval(updateStatus, 30_000);
    window.addEventListener('focus', updateStatus);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', updateStatus);
    };
  }, []);

  return storeState;
}
