import test from 'node:test';
import assert from 'node:assert/strict';
import { CreateOrderUseCase } from '../src/application/use-cases/orders/create-order-use-case.ts';
import { FindCanceledTableOrdersUseCase } from '../src/application/use-cases/orders/find-canceled-table-orders-use-case.ts';

test('identifica apenas cancelamentos novos de pedidos de mesa em preparo', () => {
  const inPreparation = { id: 'mesa-cancelada', tableNumber: 3, status: 'PREPARING' };
  const previous = new Map([
    [inPreparation.id, inPreparation],
    ['pendente', { id: 'pendente', tableNumber: 3, status: 'PENDING' }],
    ['online', { id: 'online', tableNumber: null, status: 'PREPARING' }],
    ['ativo', { id: 'ativo', tableNumber: 4, status: 'PREPARING' }],
  ]);
  const current = new Map([['ativo', previous.get('ativo')]]);
  const history = ['mesa-cancelada', 'pendente', 'online', 'ativo'].map((id) => ({ id, status: 'CANCELED' }));
  const useCase = new FindCanceledTableOrdersUseCase();

  assert.deepEqual(useCase.execute({ previous, current, history, acknowledgedIds: new Set() }), [inPreparation]);
  assert.deepEqual(useCase.execute({ previous, current, history, acknowledgedIds: new Set(['mesa-cancelada']) }), []);
});
import { CreateTableOrderUseCase } from '../src/application/use-cases/orders/create-table-order-use-case.ts';
import { ListSavedOrdersUseCase } from '../src/application/use-cases/orders/list-saved-orders-use-case.ts';
import { RemoveSavedOrderUseCase } from '../src/application/use-cases/orders/remove-saved-order-use-case.ts';
import { ListPreparingOrdersUseCase } from '../src/application/use-cases/orders/list-preparing-orders-use-case.ts';
import { ListOrderHistoryUseCase } from '../src/application/use-cases/orders/list-order-history-use-case.ts';
import { UpdateOrderStatusUseCase } from '../src/application/use-cases/orders/update-order-status-use-case.ts';
import { AdminSessionNotFoundError } from '../src/application/errors/admin-session-not-found-error.ts';
import { ValidationError } from '../src/application/errors/validation-error.ts';

const session = { get: () => ({ token: 'admin-token' }) };
const cart = [
  {
    key: ' item-1 ',
    product: { id: ' p1 ', name: ' Pastel ', price: ' 12.50 ' },
    quantity: 2,
    additions: [{ addition: { id: ' a1 ', name: ' Queijo ', price: ' 3.00 ' }, quantity: 1 }],
  },
];
const input = {
  customerName: ' Ana Silva ',
  customerPhone: '(99) 99999-1234',
  observation: ' Sem cebola ',
  cart,
};
const createdOrder = { id: 'o1', trackingToken: 'track-1', status: 'PENDING', total: '31.00' };
const openStore = { execute: async () => ({ status: 'OPEN' }) };

test('cria pedido, salva histórico e dados do cliente somente após resposta da API', async () => {
  const calls = [];
  const orders = {
    create: async (payload) => {
      calls.push(['create', payload]);
      return createdOrder;
    },
  };
  const history = {
    save: (order) => {
      calls.push(['history', order]);
    },
  };
  const customerInfo = {
    save: (info) => {
      calls.push(['customer', info]);
    },
  };
  const useCase = new CreateOrderUseCase(orders, history, customerInfo, openStore, () => new Date('2026-10-25T12:00:00Z'));

  assert.deepEqual(await useCase.execute(input), createdOrder);
  assert.deepEqual(calls[0], [
    'create',
    {
      customerName: 'Ana Silva',
      customerPhone: '99999991234',
      observation: 'Sem cebola',
      items: [{ productId: 'p1', quantity: 2, additions: [{ additionId: 'a1', quantity: 1 }] }],
    },
  ]);
  assert.deepEqual(calls[1], [
    'history',
    {
      ...createdOrder,
      details: {
        customerName: 'Ana Silva',
        customerPhone: '99999991234',
        observation: 'Sem cebola',
        createdAt: '2026-10-25T12:00:00.000Z',
        items: [
          {
            productName: 'Pastel',
            quantity: 2,
            unitPrice: '12.50',
            additions: [{ additionName: 'Queijo', quantity: 1, unitPrice: '3.00' }],
          },
        ],
      },
    },
  ]);
  assert.deepEqual(calls[2], ['customer', { name: 'Ana Silva', phone: '99999991234' }]);
  assert.equal(input.customerName, ' Ana Silva ');
});

test('falha na criação não grava histórico nem dados do cliente', async () => {
  let saved = false;
  const orders = {
    create: async () => {
      throw new Error('API indisponível');
    },
  };
  const history = {
    save: () => {
      saved = true;
    },
  };
  const customerInfo = {
    save: () => {
      saved = true;
    },
  };
  const useCase = new CreateOrderUseCase(orders, history, customerInfo, openStore);

  await assert.rejects(useCase.execute(input), /API indisponível/);
  assert.equal(saved, false);
});

test('loja fechada impede criação e gravação do pedido', async () => {
  let created = false;
  const orders = { create: async () => { created = true; return createdOrder; } };
  const history = { save: () => { throw new Error('não deveria salvar'); } };
  const customerInfo = { save: () => { throw new Error('não deveria salvar'); } };
  const closedStore = { execute: async () => ({ status: 'CLOSED' }) };
  const useCase = new CreateOrderUseCase(orders, history, customerInfo, closedStore);

  await assert.rejects(useCase.execute(input), /loja está fechada/);
  assert.equal(created, false);
});

test('pedido de mesa usa o token da sessão e o ID formatado', async () => {
  const calls = [];
  const orders = {
    create: async (...args) => {
      calls.push(args);
      return createdOrder;
    },
  };
  const useCase = new CreateTableOrderUseCase(orders, session);

  assert.deepEqual(await useCase.execute({ ...input, tableId: ' mesa-1 ' }), createdOrder);
  assert.deepEqual(calls, [
    [
      {
        customerName: 'Ana Silva',
        customerPhone: '99999991234',
        observation: 'Sem cebola',
        tableId: 'mesa-1',
        items: [{ productId: 'p1', quantity: 2, additions: [{ additionId: 'a1', quantity: 1 }] }],
      },
      'admin-token',
    ],
  ]);

  const withoutSession = new CreateTableOrderUseCase(orders, { get: () => null });
  assert.throws(() => withoutSession.execute({ ...input, tableId: 'mesa-1' }), AdminSessionNotFoundError);
  assert.equal(calls.length, 1);
});

test('lista e remove pedidos salvos com token de acompanhamento formatado', () => {
  const calls = [];
  const history = {
    list: () => [createdOrder],
    remove: (token) => {
      calls.push(token);
      return [];
    },
  };

  assert.deepEqual(new ListSavedOrdersUseCase(history).execute(), [createdOrder]);
  assert.deepEqual(new RemoveSavedOrderUseCase(history).execute(' track-1 '), []);
  assert.deepEqual(calls, ['track-1']);
  assert.throws(() => new RemoveSavedOrderUseCase(history).execute(' '), ValidationError);
  assert.deepEqual(calls, ['track-1']);
});

for (const [name, UseCase, method] of [
  ['em preparo', ListPreparingOrdersUseCase, 'preparing'],
  ['histórico', ListOrderHistoryUseCase, 'history'],
]) {
  test(`lista pedidos ${name} com data formatada`, async () => {
    const calls = [];
    const orders = {
      [method]: async (...args) => {
        calls.push(args);
        return [createdOrder];
      },
    };
    const useCase = new UseCase(orders, session);

    assert.deepEqual(await useCase.execute({ date: ' 2026-10-25 ' }), [createdOrder]);
    assert.deepEqual(calls, [['admin-token', '2026-10-25']]);
    assert.throws(() => useCase.execute({ date: '2026-02-30' }), ValidationError);
    assert.equal(calls.length, 1);
  });
}

test('altera status permitido e bloqueia status inválido', async () => {
  const calls = [];
  const orders = {
    changeStatus: async (...args) => {
      calls.push(args);
      return 'ok';
    },
  };
  const useCase = new UpdateOrderStatusUseCase(orders, session);

  assert.equal(await useCase.execute({ orderId: ' o1 ', status: ' PREPARING ' }), 'ok');
  assert.deepEqual(calls, [['admin-token', 'o1', 'PREPARING']]);
  assert.throws(() => useCase.execute({ orderId: 'o1', status: 'UNKNOWN' }), ValidationError);
  assert.equal(calls.length, 1);
});
