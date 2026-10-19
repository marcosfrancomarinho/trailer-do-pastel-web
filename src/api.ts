export type Category = { id: string; name: string }
export type Product = { id: string; name: string; description: string; categoryId: string; price: string; available: boolean }
export type Addition = { id: string; name: string; price: string; available: boolean }
export type OrderPayload = { customerName: string; customerPhone: string; items: { productId: string; quantity: number; additions: { additionId: string; quantity: number }[] }[] }
export type CreatedOrder = { id: string; trackingToken: string; status: string; total: string }
export type PendingOrder = { id: string; customerName: string; customerPhone: string; status: string; total: string; createdAt: string; items: { productName: string; quantity: number; unitPrice: string; additions: { additionName: string; quantity: number; unitPrice: string }[] }[] }
const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try { response = await fetch(base + path, { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } }) }
  catch { throw new Error('Não foi possível conectar à API. Verifique VITE_API_URL e o servidor.') }
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const msg = body && typeof body === 'object' && 'message' in body ? String(body.message) : 'Erro HTTP ' + response.status
    throw new Error(msg)
  }
  return body as T
}
export const brl = (value: number | string) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
