const API_URL = (import.meta.env.VITE_API_URL || 'https://trailer-do-pastel.onrender.com').replace(/\/$/, '');

function decodeKey(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index++) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

export function pushSupported(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext &&
    'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

let pendingSubscription: Promise<PushSubscription> | null = null;

async function getPushSubscription(publicKey: string): Promise<PushSubscription> {
  if (pendingSubscription) return pendingSubscription;
  const attempt = (async () => {
    const registration = await navigator.serviceWorker.register('/push-sw.js');
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      const currentKey = existing.options.applicationServerKey;
      const expected = decodeKey(publicKey);
      if (currentKey && new Uint8Array(currentKey).every((byte, index) => byte === expected[index]) &&
          currentKey.byteLength === expected.byteLength) {
        return existing;
      }
      await existing.unsubscribe();
    }
    try {
      return await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeKey(publicKey),
      });
    } catch (error) {
      if (error instanceof Error && /push service error|registration failed/i.test(error.message)) {
        throw new Error('O serviço de notificações do Chrome não respondeu. Confira a conexão com a internet e tente novamente. Se persistir, atualize o Chrome e desative temporariamente VPN ou DNS privado.');
      }
      throw error;
    }
  })();
  pendingSubscription = attempt;
  try { return await attempt; }
  finally { if (pendingSubscription === attempt) pendingSubscription = null; }
}

export async function registerOrderPush(tokens: string[]): Promise<void> {
  if (!pushSupported() || Notification.permission !== 'granted' || tokens.length === 0) return;
  const response = await fetch(API_URL + '/push/vapid-public-key');
  if (!response.ok) throw new Error('Web Push indisponível');
  const { publicKey } = await response.json() as { publicKey: string | null };
  if (!publicKey) throw new Error('Web Push ainda não foi configurado na loja.');
  const subscription = await getPushSubscription(publicKey);
  const payload = subscription.toJSON();
  await Promise.all(tokens.map(async (token) => {
    const saved = await fetch(API_URL + '/orders/tracking/' + encodeURIComponent(token) + '/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!saved.ok) throw new Error('Não foi possível ativar os avisos deste pedido.');
  }));
}

export async function unsubscribeOrderPush(token: string): Promise<void> {
  if (!pushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration('/push-sw.js');
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await fetch(API_URL + '/orders/tracking/' + encodeURIComponent(token) + '/push', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
}
