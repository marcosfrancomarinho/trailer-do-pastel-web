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
    const baseUrl = (import.meta.env.VITE_API_URL || 'https://trailer-do-pastel.onrender.com').replace(/\/$/, '');
    const stream = new EventSource(baseUrl + '/store/events');
    stream.onopen = refreshStatus;
    stream.onmessage = refreshStatus;
    // Polling is a fallback only when SSE is disconnected.
    const timer = window.setInterval(() => {
      if (stream.readyState !== EventSource.OPEN) refreshStatus();
    }, 30_000);
    window.addEventListener('focus', refreshStatus);

    return () => {
      active = false;
      window.clearInterval(timer);
      stream.close();
      window.removeEventListener('focus', refreshStatus);
    };
  }, [useCases]);

  return storeState;
}
