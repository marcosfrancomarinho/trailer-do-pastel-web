import test from 'node:test';
import assert from 'node:assert/strict';
import { OrderHistoryStorageAdapter } from '../src/infrastructure/storage/order-history-adapter.ts';

test('migra pedido legado, atualiza pelo token e não restaura pedido removido', () => {
  const previousStorage = globalThis.localStorage;
  const legacyOrder = { id: 'order-1', trackingToken: 'tracking-1', status: 'PENDING', total: '12.00' };
  const store = new Map([['pastel-order', JSON.stringify(legacyOrder)]]);
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };

  try {
    const history = new OrderHistoryStorageAdapter();
    assert.deepEqual(history.list(), [legacyOrder]);
    assert.equal(store.has('pastel-order'), false);

    const updatedOrder = { ...legacyOrder, total: '18.00' };
    assert.deepEqual(history.save(updatedOrder), [updatedOrder]);
    assert.deepEqual(history.remove('tracking-1'), []);
    assert.deepEqual(history.list(), []);
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  }
});
