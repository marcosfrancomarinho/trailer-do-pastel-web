import test from 'node:test';
import assert from 'node:assert/strict';
import { CreateProductUseCase } from '../src/application/use-cases/catalog/create-product-use-case.ts';
import { ListPendingOrdersUseCase } from '../src/application/use-cases/orders/list-pending-orders-use-case.ts';
import { SaveCartUseCase } from '../src/application/use-cases/cart/save-cart-use-case.ts';
import { CreateTableUseCase } from '../src/application/use-cases/tables/create-table-use-case.ts';
import { TrackOrderUseCase } from '../src/application/use-cases/orders/track-order-use-case.ts';
import { AdminSessionNotFoundError } from '../src/application/errors/admin-session-not-found-error.ts';
import { ValidationError } from '../src/application/errors/validation-error.ts';

const session = { get: () => ({ token: 'admin-token' }) };
const isValidationError = (error) => error instanceof ValidationError;

test('produto inválido não chega ao gateway; produto válido mantém os dados', async () => {
  const calls = [];
  const useCase = new CreateProductUseCase(
    {
      createProduct: async (token, data) => {
        calls.push({ token, data });
      },
    },
    session,
  );
  const data = {
    name: 'Pastel',
    description: '',
    price: '12.50',
    categoryId: 'cat-1',
    imageUrl: null,
    additionIds: [],
    available: true,
  };

  assert.throws(() => useCase.execute({ data: { ...data, name: ' ' } }), isValidationError);
  assert.equal(calls.length, 0);
  await useCase.execute({ data });
  assert.deepEqual(calls, [{ token: 'admin-token', data }]);
});

test('data inválida não consulta pedidos', async () => {
  const calls = [];
  const useCase = new ListPendingOrdersUseCase(
    {
      pending: async (token, date) => {
        calls.push({ token, date });
        return [];
      },
    },
    session,
  );

  assert.throws(() => useCase.execute({ date: '2026-02-30' }), isValidationError);
  assert.equal(calls.length, 0);
  await useCase.execute({ date: '2026-02-28' });
  await useCase.execute({ date: ' 2026-02-28 ' });
  assert.deepEqual(calls, [
    { token: 'admin-token', date: '2026-02-28' },
    { token: 'admin-token', date: '2026-02-28' },
  ]);
});

test('carrinho inválido não é salvo e carrinho vazio pode ser salvo', () => {
  const calls = [];
  const useCase = new SaveCartUseCase({ save: (items) => calls.push(items) });
  const item = { key: 'p1', product: { id: 'p1' }, quantity: 0, additions: [] };

  assert.throws(() => useCase.execute([item]), {
    name: 'ValidationError',
    field: 'items[0].product.name',
  });
  assert.equal(calls.length, 0);
  useCase.execute([]);
  assert.deepEqual(calls, [[]]);
});

test('número de mesa inválido não é enviado ao gateway', async () => {
  const calls = [];
  const useCase = new CreateTableUseCase(
    {
      createTable: async (token, number) => {
        calls.push({ token, number });
        return { id: 't1', number };
      },
    },
    session,
  );

  assert.throws(() => useCase.execute({ number: 0 }), isValidationError);
  assert.equal(calls.length, 0);
  await useCase.execute({ number: 3 });
  assert.deepEqual(calls, [{ token: 'admin-token', number: 3 }]);
});

test('acompanhamento exige código e sinal de cancelamento válidos', async () => {
  const calls = [];
  const useCase = new TrackOrderUseCase({
    tracking: async (trackingToken, signal) => {
      calls.push({ trackingToken, signal });
      return { status: 'PENDING' };
    },
  });

  assert.throws(() => useCase.execute({ trackingToken: ' ' }), isValidationError);
  assert.throws(() => useCase.execute({ trackingToken: 'abc', signal: null }), isValidationError);
  assert.equal(calls.length, 0);
  await useCase.execute({ trackingToken: 'abc' });
  await useCase.execute({ trackingToken: ' abc ' });
  assert.deepEqual(calls, [
    { trackingToken: 'abc', signal: undefined },
    { trackingToken: 'abc', signal: undefined },
  ]);
});

test('validação devolve produto formatado e erros específicos por campo', async () => {
  const calls = [];
  const useCase = new CreateProductUseCase(
    {
      createProduct: async (token, data) => {
        calls.push({ token, data });
      },
    },
    session,
  );
  const data = {
    name: '  Pastel  ',
    description: '  Queijo  ',
    price: ' 12.50 ',
    categoryId: ' cat-1 ',
    imageUrl: null,
    additionIds: [' extra-1 '],
    available: true,
  };

  assert.throws(() => useCase.execute({ data: { ...data, name: ' ' } }), {
    name: 'ValidationError',
    field: 'data.name',
    message: 'Nome do produto é obrigatório.',
  });
  assert.throws(() => useCase.execute({ data: { ...data, price: 'abc' } }), {
    name: 'ValidationError',
    field: 'data.price',
    message: 'Preço do produto deve ser numérico.',
  });
  await useCase.execute({ data });
  assert.deepEqual(calls, [
    {
      token: 'admin-token',
      data: { ...data, name: 'Pastel', description: 'Queijo', price: '12.50', categoryId: 'cat-1', additionIds: ['extra-1'] },
    },
  ]);
  assert.equal(data.name, '  Pastel  ');
});

test('validação formata o carrinho antes de salvar', () => {
  const calls = [];
  const useCase = new SaveCartUseCase({ save: (items) => calls.push(items) });
  const items = [
    {
      key: ' item-1 ',
      product: { id: ' p1 ', name: ' Pastel ', price: ' 10.00 ' },
      quantity: 1,
      additions: [{ addition: { id: ' a1 ', name: ' Queijo ', price: ' 2.00 ' }, quantity: 1 }],
    },
  ];

  useCase.execute(items);
  assert.equal(calls[0][0].key, 'item-1');
  assert.deepEqual(calls[0][0].product, { id: 'p1', name: 'Pastel', price: '10.00' });
  assert.deepEqual(calls[0][0].additions[0].addition, { id: 'a1', name: 'Queijo', price: '2.00' });
  assert.equal(items[0].key, ' item-1 ');
});

test('sessão ausente gera erro; token da sessão é repassado ao gateway', async () => {
  const data = {
    name: 'Pastel',
    description: '',
    price: '10',
    categoryId: 'c1',
    imageUrl: null,
    additionIds: [],
    available: true,
  };
  const calls = [];
  const gateway = {
    createProduct: async (token) => {
      calls.push(token);
    },
  };
  const noSession = new CreateProductUseCase(gateway, { get: () => null });
  const noToken = new CreateProductUseCase(gateway, { get: () => ({ token: '' }) });

  assert.throws(() => noSession.execute({ data }), AdminSessionNotFoundError);
  await noToken.execute({ data });
  assert.deepEqual(calls, ['']);
});
