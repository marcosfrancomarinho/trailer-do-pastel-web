import test from 'node:test';
import assert from 'node:assert/strict';
import { CustomerInfoStorageAdapter } from '../src/infrastructure/storage/customer-info-storage.ts';

test('salva os dados do cliente e ignora conteúdo inválido', () => {
  const previousWindow = globalThis.window;
  const store = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => {
        store.set(key, value);
      },
    },
  };

  try {
    const storage = new CustomerInfoStorageAdapter();
    assert.deepEqual(storage.get(), { name: '', phone: '' });

    storage.save({ name: 'Ana', phone: '99999991234' });
    assert.deepEqual(storage.get(), { name: 'Ana', phone: '99999991234' });

    store.set('trailer-pastel-customer-info', '{inválido');
    assert.deepEqual(storage.get(), { name: '', phone: '' });
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
