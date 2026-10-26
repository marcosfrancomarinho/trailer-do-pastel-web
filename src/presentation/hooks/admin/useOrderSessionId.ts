import { useEffect, useState } from 'react';
import { useApplicationServices } from '../global/useApplicationServices';
import { usePrivateContext } from '../global/usePrivateContext';

export function useOrderSessionId(tableId: string | null | undefined, orderId: string) {
  const useCases = useApplicationServices();
  const { session } = usePrivateContext();
  const token = session?.token ?? '';
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(tableId));

  useEffect(() => {
    if (!tableId) {
      setSessionId(null);
      setLoading(false);
      return;
    }

    const currentTableId = tableId;
    let active = true;
    setSessionId(null);
    setLoading(true);

    async function loadSessionId() {
      try {
        const foundSessionId = await useCases.tables.findOrderSession.execute({ tableId: currentTableId, orderId });
        if (active) setSessionId(foundSessionId);
      } catch {
        if (active) setSessionId(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSessionId();

    return () => {
      active = false;
    };
  }, [useCases, token, tableId, orderId]);

  return { sessionId, loading };
}
