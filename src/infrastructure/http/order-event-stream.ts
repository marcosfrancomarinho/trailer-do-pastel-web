export const ORDER_EVENT = 'trailer:order-event';
export const ORDER_STREAM_READY = 'trailer:order-stream-ready';

export interface OrderEvent {
  orderId: string;
  status: string;
  tableId?: string | null;
}

export function decodeOrderEvent(payload: string): OrderEvent | null {
  try {
    const value: unknown = JSON.parse(payload);
    if (!value || typeof value !== 'object') return null;
    const record = value as Record<string, unknown>;
    if (typeof record.orderId !== 'string' || typeof record.status !== 'string') return null;
    return {
      orderId: record.orderId,
      status: record.status,
      tableId: typeof record.tableId === 'string' ? record.tableId : null,
    };
  } catch {
    return null;
  }
}

/** Returns a cleanup function. Fetch is required because the backend expects Bearer JWT. */
export function connectOrderEvents(token: string): () => void {
  if (!token) return () => {};
  const controller = new AbortController();
  const baseUrl = (import.meta.env.VITE_API_URL || 'https://trailer-do-pastel.onrender.com').replace(/\/$/, '');
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

  const connect = async (): Promise<void> => {
    if (controller.signal.aborted) return;
    try {
      const response = await fetch(baseUrl + '/orders/events', {
        headers: { Authorization: 'Bearer ' + token, Accept: 'text/event-stream' },
        cache: 'no-store',
        signal: controller.signal,
      });
      if (response.status === 401 || response.status === 403) return;
      if (!response.ok || !response.body) throw new Error('SSE indisponível');
      window.dispatchEvent(new Event(ORDER_STREAM_READY));
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (!controller.signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          const frame = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const data = frame.split('\n').filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trimStart()).join('\n');
          if (data) {
            const event = decodeOrderEvent(data);
            if (event) window.dispatchEvent(new CustomEvent<OrderEvent>(ORDER_EVENT, { detail: event }));
          }
          boundary = buffer.indexOf('\n\n');
        }
      }
    } catch {
      // O navegador ou proxy pode interromper conexões longas.
    }
    if (!controller.signal.aborted) reconnectTimer = setTimeout(() => { void connect(); }, 3000);
  };

  void connect();
  return () => {
    controller.abort();
    if (reconnectTimer) clearTimeout(reconnectTimer);
  };
}
