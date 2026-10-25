import test from 'node:test';
import assert from 'node:assert/strict';
import { SignInUseCase } from '../src/application/use-cases/auth/sign-in-use-case.ts';
import { GetSessionUseCase } from '../src/application/use-cases/auth/get-session-use-case.ts';
import { SignOutUseCase } from '../src/application/use-cases/auth/sign-out-use-case.ts';
import { SessionStorageAdapter } from '../src/infrastructure/storage/admin-session-storage.ts';

test('salva a sessão somente após autenticação e limpa no logout', async () => {
  const previousWindow = globalThis.window;
  const stored = new Map();
  globalThis.window = {
    atob: globalThis.atob,
    sessionStorage: {
      getItem: (key) => stored.get(key) ?? null,
      setItem: (key, value) => stored.set(key, value),
      removeItem: (key) => stored.delete(key),
    },
  };

  try {
    const adminSessionAdapter = new SessionStorageAdapter();
    const session = {
      token: `header.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.signature`,
      name: 'Ana',
      role: 'ADMIN',
    };
    const signIn = new SignInUseCase({ signIn: async () => session }, adminSessionAdapter);
    const getSession = new GetSessionUseCase(adminSessionAdapter);
    const signOut = new SignOutUseCase(adminSessionAdapter);

    assert.equal(getSession.execute(), null);
    assert.deepEqual(await signIn.execute({ name: 'Ana', password: 'senha' }), session);
    assert.deepEqual(getSession.execute(), session);
    assert.equal(stored.get('trailer-pastel-admin-session'), session.token);

    const failingSignIn = new SignInUseCase(
      {
        signIn: async () => {
          throw new Error('Credenciais inválidas');
        },
      },
      adminSessionAdapter,
    );
    await assert.rejects(failingSignIn.execute({ name: 'Ana', password: 'errada' }), /Credenciais inválidas/);
    assert.deepEqual(getSession.execute(), session);

    signOut.execute();
    assert.equal(getSession.execute(), null);
    assert.equal(stored.size, 0);

    const expiredToken = `header.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 60 })).toString('base64url')}.signature`;
    stored.set('trailer-pastel-admin-session', expiredToken);
    stored.set('trailer-admin-role', 'ADMIN');
    stored.set('trailer-admin-name', 'Ana');
    assert.equal(getSession.execute(), null);
    assert.equal(stored.size, 0);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
