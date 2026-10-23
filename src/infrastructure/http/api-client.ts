const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(base + path, {
      ...init,
      headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
    })
  } catch { throw new Error('Não foi possível conectar à API. Confira VITE_API_URL e o servidor.') }
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const msg = body && typeof body === 'object' && 'message' in body ? String(body.message) : 'Erro HTTP ' + response.status
    throw new Error(msg)
  }
  return body as T
}
