import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../src/infrastructure/http/api-client.ts';
import { AuthHttpAdapter } from '../src/infrastructure/http/auth-http-adapter.ts';

async function withFetch(fetcher, run) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetcher;
  try {
    return await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test('adaptador usa o cliente injetado e prepara URL e cabeçalhos', async () => {
  const requests = [];
  const fetcher = async (url, init) => {
    requests.push({ url, init });
    return Response.json({ name: 'Ana', role: 'ADMIN', accessToken: 'token-1' });
  };
  const apiClient = new ApiClient('https://api.example.test/');
  const auth = new AuthHttpAdapter(apiClient);

  const session = await withFetch(fetcher, () => auth.signIn('Ana', 'senha'));

  assert.deepEqual(session, { name: 'Ana', role: 'ADMIN', token: 'token-1' });
  assert.equal(requests[0].url, 'https://api.example.test/login');
  assert.equal(requests[0].init.method, 'POST');
  assert.equal(requests[0].init.body, JSON.stringify({ name: 'Ana', password: 'senha' }));
  assert.deepEqual(requests[0].init.headers, { 'Content-Type': 'application/json' });
});

test('cliente preserva mensagem HTTP e informa falha de conexão', async () => {
  const client = new ApiClient('https://api.example.test');
  await withFetch(async () => Response.json({ message: 'Acesso negado.' }, { status: 403 }), async () => {
    await assert.rejects(client.request('/private'), /Acesso negado\./);
  });
  await withFetch(async () => { throw new Error('network down'); }, async () => {
    await assert.rejects(client.request('/private'), /Não foi possível conectar à API/);
  });
});
