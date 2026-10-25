export class ApiClient {
  private base: string;

  public constructor(baseUrl: string = import.meta.env.VITE_API_URL || 'https://trailer-do-pastel.onrender.com') {
    this.base = baseUrl.replace(/\/$/, '');
  }

  public async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
      response = await fetch(this.base + path, {
        ...init,
        headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
      });
    } catch {
      throw new Error('Não foi possível conectar à API. Confira VITE_API_URL e o servidor.');
    }
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        body && typeof body === 'object' && 'message' in body ? String(body.message) : 'Erro HTTP ' + response.status;
      throw new Error(message);
    }
    return body as T;
  }
}
