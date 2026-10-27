import test from 'node:test';
import assert from 'node:assert/strict';
import {
  orderQueryClient, getPendingOrders, getPreparingOrders,
  getOrderHistory, invalidateOrderQueries, orderQueryKeys,
} from '../src/infrastructure/query/order-query-cache.ts';

test('compartilha uma única requisição simultânea entre consumidores da mesma lista', async () => {
  orderQueryClient.clear();
  let calls = 0;
  let release;
  const deferred = new Promise((resolve) => { release = resolve; });
  const services = {
    orders: { listPending: { execute: async () => { calls++; await deferred; return [{ id: '1' }]; } } },
  };
  const a = getPendingOrders(services, 'session-1', '2026-10-27');
  const b = getPendingOrders(services, 'session-1', '2026-10-27');
  release();
  const [first, second] = await Promise.all([a, b]);
  assert.equal(calls, 1);
  assert.deepEqual(first, second);
});

test('separa o cache por sessão, data e tipo de pedido', async () => {
  orderQueryClient.clear();
  let calls = 0;
  const execute = async () => [{ id: String(++calls) }];
  const services = { orders: {
    listPending: { execute }, listPreparing: { execute }, listHistory: { execute },
  } };
  await getPendingOrders(services, 'A', '2026-10-27');
  await getPendingOrders(services, 'B', '2026-10-27');
  await getPreparingOrders(services, 'A', '2026-10-27');
  await getOrderHistory(services, 'A', '2026-10-26');
  assert.equal(calls, 4);
  assert.notDeepEqual(orderQueryKeys.pending('A', 'today'), orderQueryKeys.pending('B', 'today'));
});

test('invalidação SSE marca as consultas antigas sem gravar o payload como dados', async () => {
  orderQueryClient.clear();
  const services = { orders: { listPending: { execute: async () => [{ id: 'persistido-na-api' }] } } };
  await getPendingOrders(services, 'A', '2026-10-27');
  await invalidateOrderQueries();
  const query = orderQueryClient.getQueryCache().find({ queryKey: orderQueryKeys.pending('A', '2026-10-27') });
  assert.equal(query?.state.isInvalidated, true);
  assert.deepEqual(query?.state.data, [{ id: 'persistido-na-api' }]);
});
