import test from 'node:test';
import assert from 'node:assert/strict';
import { AdminSessionNotFoundError } from '../src/application/errors/admin-session-not-found-error.ts';
import { ValidationError } from '../src/application/errors/validation-error.ts';

const loadUseCase = async (area, name) => {
  const module = await import(`../src/application/use-cases/${area}/${name}-use-case.ts`);
  const className = name.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join('') + 'UseCase';
  return module[className];
};

const product = { name: 'Pastel', description: '', price: '12.50', categoryId: 'c1', imageUrl: null, additionIds: [], available: true };
const addition = { name: 'Queijo', price: '3.00', available: true };
const category = { name: 'Pastéis' };
const cart = [{ key: 'p1', product: { id: 'p1', name: 'Pastel', price: '12.50' }, quantity: 1, additions: [] }];
const order = { customerName: 'Ana', customerPhone: '99999991234', observation: '', cart, tableId: 't1' };

const cases = [
  ...[
    ['create-product', 'createProduct', { data: product }, { data: { ...product, price: 'bad' } }],
    ['update-product', 'updateProduct', { id: 'p1', data: product }, { id: ' ', data: product }],
    ['remove-product', 'removeProduct', { id: 'p1' }, { id: ' ' }],
    ['create-addition', 'createAddition', { data: addition }, { data: { ...addition, price: '0' } }],
    ['update-addition', 'updateAddition', { id: 'a1', data: addition }, { id: ' ', data: addition }],
    ['remove-addition', 'removeAddition', { id: 'a1' }, { id: ' ' }],
    ['create-category', 'createCategory', { data: category }, { data: { name: ' ' } }],
    ['update-category', 'updateCategory', { id: 'c1', data: category }, { id: ' ', data: category }],
    ['remove-category', 'removeCategory', { id: 'c1' }, { id: ' ' }],
  ].map(([name, method, valid, invalid]) => ['catalog', name, method, valid, invalid]),
  ['orders', 'create-table-order', 'create', order, { ...order, tableId: ' ' }],
  ['orders', 'list-pending-orders', 'pending', { date: '2026-10-25' }, { date: '2026-02-30' }],
  ['orders', 'list-preparing-orders', 'preparing', { date: '2026-10-25' }, { date: '2026-02-30' }],
  ['orders', 'list-order-history', 'history', { date: '2026-10-25' }, { date: '2026-02-30' }],
  ['orders', 'update-order-status', 'changeStatus', { orderId: 'o1', status: 'COMPLETED' }, { orderId: 'o1', status: 'PENDING' }],
  ['tables', 'list-tables', 'tables'],
  ['tables', 'create-table', 'createTable', { number: 1 }, { number: 0 }],
  ['tables', 'archive-table', 'archiveTable', { tableId: 't1' }, { tableId: ' ' }],
  ['tables', 'list-table-orders', 'tableOrders', { tableId: 't1' }, { tableId: ' ' }],
  ['tables', 'list-table-sessions', 'tableSessions', { tableId: 't1' }, { tableId: ' ' }],
  ['tables', 'list-closed-comandas', 'closedComandas', { date: '2026-10-25' }, { date: '2026-02-30' }],
  ['tables', 'remove-table-order', 'removeTableOrder', { tableId: 't1', orderId: 'o1' }, { tableId: 't1', orderId: ' ' }],
  ['store', 'change-store-status', 'setStoreOpen', { open: true }, { open: 'true' }],
  ['users', 'list-users', 'users'],
  ['users', 'create-user', 'createUser', { name: 'Ana', password: '12345678' }, { name: 'Ana', password: 'short' }],
  ['users', 'remove-user', 'removeUser', { userId: 'u1' }, { userId: ' ' }],
];

for (const [area, name, method, valid, invalid] of cases) {
  test(`${area}/${name}: valida antes da sessão, exige sessão e propaga falha do gateway`, async () => {
    const UseCase = await loadUseCase(area, name);
    const calls = [];
    const failure = new Error(`Falha em ${method}`);
    const gateway = { [method]: (...args) => { calls.push(args); return Promise.reject(failure); } };
    let sessionReads = 0;
    const absent = { get: () => { sessionReads++; return null; } };
    const withSession = { get: () => { sessionReads++; return { token: 'token-1' }; } };

    if (invalid !== undefined) {
      assert.throws(() => new UseCase(gateway, absent).execute(invalid), ValidationError);
      assert.equal(sessionReads, 0);
      assert.deepEqual(calls, []);
    }
    assert.throws(() => new UseCase(gateway, absent).execute(valid), AdminSessionNotFoundError);
    assert.equal(sessionReads, 1);
    assert.deepEqual(calls, []);

    const result = valid === undefined
      ? new UseCase(gateway, withSession).execute()
      : new UseCase(gateway, withSession).execute(valid);
    await assert.rejects(result, (error) => error === failure);
    assert.equal(sessionReads, 2);
    assert.equal(calls.length, 1);
    assert.ok(calls[0].includes('token-1'));
  });
}

test('find-order-session: falhas de leitura são propagadas e nenhuma consulta ocorre sem sessão', async () => {
  const UseCase = await loadUseCase('tables', 'find-order-session');
  const failure = new Error('API indisponível');
  let calls = 0;
  const gateway = { tableSessions: () => { calls++; return Promise.reject(failure); } };
  await assert.rejects(new UseCase(gateway, { get: () => null }).execute({ tableId: 't1', orderId: 'o1' }), AdminSessionNotFoundError);
  assert.equal(calls, 0);
  await assert.rejects(new UseCase(gateway, { get: () => ({ token: 't' }) }).execute({ tableId: 't1', orderId: 'o1' }), (error) => error === failure);
  assert.equal(calls, 1);
});

test('get-table-release-status: erro da API é propagado sem fabricar contagem', async () => {
  const UseCase = await loadUseCase('tables', 'get-table-release-status');
  const failure = new Error('API indisponível');
  let calls = 0;
  const gateway = { tableOrders: () => { calls++; return Promise.reject(failure); } };
  await assert.rejects(new UseCase(gateway, { get: () => null }).execute({ tableId: 't1' }), AdminSessionNotFoundError);
  assert.equal(calls, 0);
  await assert.rejects(new UseCase(gateway, { get: () => ({ token: 't' }) }).execute({ tableId: 't1' }), (error) => error === failure);
  assert.equal(calls, 1);
});

test('release-table: falha ao consultar pedidos impede liberar a mesa', async () => {
  const UseCase = await loadUseCase('tables', 'release-table');
  const failure = new Error('Consulta indisponível');
  let released = false;
  const gateway = { releaseTable: () => { released = true; } };
  const releaseStatus = { execute: async () => { throw failure; } };
  await assert.rejects(new UseCase(gateway, releaseStatus, { get: () => ({ token: 't' }) }).execute({ tableId: 't1' }), (error) => error === failure);
  assert.equal(released, false);
});

test('release-table: consulta o status, mas não libera sem sessão', async () => {
  const UseCase = await loadUseCase('tables', 'release-table');
  const calls = [];
  const useCase = new UseCase(
    { releaseTable: () => calls.push('release') },
    { execute: async (input) => { calls.push(input); return { unfinishedCount: 0 }; } },
    { get: () => null },
  );
  await assert.rejects(useCase.execute({ tableId: ' t1 ' }), AdminSessionNotFoundError);
  assert.deepEqual(calls, [{ tableId: 't1' }]);
});

test('create-order: entrada inválida não consulta loja, API nem armazenamento', async () => {
  const UseCase = await loadUseCase('orders', 'create-order');
  const calls = [];
  const useCase = new UseCase(
    { create: () => calls.push('api') },
    { save: () => calls.push('history') },
    { save: () => calls.push('customer') },
    { execute: () => { calls.push('store'); return { status: 'OPEN' }; } },
  );
  await assert.rejects(useCase.execute({ ...order, cart: [{ ...cart[0], quantity: 0 }] }), (error) => {
    assert.ok(error instanceof ValidationError);
    assert.equal(error.field, 'cart[0].quantity');
    return true;
  });
  assert.deepEqual(calls, []);
});

test('create-order: observação vazia vira null na API e no histórico', async () => {
  const UseCase = await loadUseCase('orders', 'create-order');
  const calls = [];
  const created = { id: 'o1', trackingToken: 't1' };
  const useCase = new UseCase(
    { create: async (payload) => { calls.push(['api', payload]); return created; } },
    { save: (value) => calls.push(['history', value]) },
    { save: (value) => calls.push(['customer', value]) },
    { execute: async () => ({ status: 'OPEN' }) },
    () => new Date('2026-10-25T12:00:00Z'),
  );
  assert.equal(await useCase.execute({ ...order, observation: '   ' }), created);
  assert.equal(calls[0][1].observation, null);
  assert.equal(calls[1][1].details.observation, null);
  assert.equal(calls[2][1].phone, '99999991234');
});

test('add-cart-item: rejeita indisponíveis e quantidades inválidas sem alterar o carrinho', async () => {
  const UseCase = await loadUseCase('cart', 'add-cart-item');
  const useCase = new UseCase();
  const base = { cart: [], product: { id: 'p1', available: true }, additions: [{ id: 'a1', available: true }], amounts: { a1: 2 }, quantity: 1 };
  for (const input of [
    { ...base, product: { id: 'p1', available: false } },
    { ...base, quantity: 0 },
    { ...base, quantity: 1.5 },
    { ...base, quantity: Number.MAX_SAFE_INTEGER + 1 },
    { ...base, amounts: { a1: 1.5 } },
    { ...base, amounts: { a1: Number.MAX_SAFE_INTEGER + 1 } },
  ]) assert.throws(() => useCase.execute(input), ValidationError);
  assert.deepEqual(base.cart, []);

  const first = useCase.execute(base);
  const second = useCase.execute({ ...base, cart: first, quantity: 3 });
  assert.equal(first[0].quantity, 1);
  assert.equal(second[0].quantity, 4);
  assert.equal(second[0].key, 'p1:a1-2');
  assert.notEqual(second[0], first[0]);
  for (const amounts of [{}, { a1: null }, { a1: 0 }, { a1: -2 }]) {
    const withoutAddition = useCase.execute({ ...base, amounts });
    assert.deepEqual(withoutAddition[0].additions, []);
    assert.equal(withoutAddition[0].key, 'p1:');
  }
});

test('list-table-overview: não consulta mesas livres nem marca mesa sem pedidos como pronta', async () => {
  const UseCase = await loadUseCase('tables', 'list-table-overview');
  const calls = [];
  const tables = [
    { id: 'free', status: 'FREE' },
    { id: 'empty', status: 'OCCUPIED' },
    { id: 'ready', status: 'OCCUPIED' },
    { id: 'failed', status: 'OCCUPIED' },
  ];
  const useCase = new UseCase(
    { execute: async () => tables },
    { execute: async ({ tableId }) => {
      calls.push(tableId);
      if (tableId === 'failed') throw new Error('Rede');
      return { orders: tableId === 'empty' ? [] : [{ status: 'COMPLETED' }] };
    } },
  );
  const result = await useCase.execute(new Set(['failed', 'free']));
  assert.equal(result.tables, tables);
  assert.deepEqual(calls, ['empty', 'ready', 'failed']);
  assert.deepEqual([...result.readyTableIds].sort(), ['failed', 'ready']);
});
