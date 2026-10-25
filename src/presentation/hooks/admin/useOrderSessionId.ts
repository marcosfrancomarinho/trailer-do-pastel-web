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

    let active = true;
    setSessionId(null);
    setLoading(true);
    void useCases.tables.findOrderSession
      .execute({ tableId, orderId })
      .then((id) => {
        if (active) setSessionId(id);
      })
      .catch(() => {
        if (active) setSessionId(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, tableId, orderId]);

  return { sessionId, loading };
}
