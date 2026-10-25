import test from 'node:test';
import assert from 'node:assert/strict';
import { ListTablesUseCase } from '../src/application/use-cases/tables/list-tables-use-case.ts';
import { ListTableOverviewUseCase } from '../src/application/use-cases/tables/list-table-overview-use-case.ts';
import { CreateTableUseCase } from '../src/application/use-cases/tables/create-table-use-case.ts';
import { ArchiveTableUseCase } from '../src/application/use-cases/tables/archive-table-use-case.ts';
import { ListTableOrdersUseCase } from '../src/application/use-cases/tables/list-table-orders-use-case.ts';
import { ListTableSessionsUseCase } from '../src/application/use-cases/tables/list-table-sessions-use-case.ts';
import { FindOrderSessionUseCase } from '../src/application/use-cases/tables/find-order-session-use-case.ts';
import { ListClosedComandasUseCase } from '../src/application/use-cases/tables/list-closed-comandas-use-case.ts';
import { GetTableReleaseStatusUseCase } from '../src/application/use-cases/tables/get-table-release-status-use-case.ts';
import { ReleaseTableUseCase } from '../src/application/use-cases/tables/release-table-use-case.ts';
import { RemoveTableOrderUseCase } from '../src/application/use-cases/tables/remove-table-order-use-case.ts';
import { TableHasUnfinishedOrdersError } from '../src/application/errors/table-has-unfinished-orders-error.ts';
import { AdminSessionNotFoundError } from '../src/application/errors/admin-session-not-found-error.ts';
import { ValidationError } from '../src/application/errors/validation-error.ts';

const session = { get: () => ({ token: 'admin-token' }) };

test('marca mesa pronta somente com pedidos concluídos e preserva resultado em falha pontual', async () => {
  const tables = [
    { id: 'ready', status: 'OCCUPIED' },
    { id: 'pending', status: 'OCCUPIED' },
    { id: 'failed', status: 'OCCUPIED' },
    { id: 'free', status: 'FREE' },
  ];
  const listTables = { execute: async () => tables };
  const listOrders = { execute: async ({ tableId }) => {
    if (tableId === 'failed') throw new Error('network');
    return { orders: tableId === 'ready' ? [{ status: 'COMPLETED' }] : [{ status: 'PREPARING' }] };
  } };
  const result = await new ListTableOverviewUseCase(listTables, listOrders).execute(new Set(['failed', 'pending']));

  assert.deepEqual(result.tables, tables);
  assert.deepEqual([...result.readyTableIds].sort(), ['failed', 'ready']);
});

const tableOperations = [
  ['lista mesas', ListTablesUseCase, 'tables', undefined, ['admin-token']],
  ['cria mesa', CreateTableUseCase, 'createTable', { number: 3 }, ['admin-token', 3]],
  ['arquiva mesa', ArchiveTableUseCase, 'archiveTable', { tableId: ' t1 ' }, ['admin-token', 't1']],
  ['lista pedidos da mesa', ListTableOrdersUseCase, 'tableOrders', { tableId: ' t1 ' }, ['admin-token', 't1']],
  ['lista sessões da mesa', ListTableSessionsUseCase, 'tableSessions', { tableId: ' t1 ' }, ['admin-token', 't1']],
  [
    'lista comandas fechadas',
    ListClosedComandasUseCase,
    'closedComandas',
    { date: ' 2026-10-25 ' },
    ['admin-token', '2026-10-25'],
  ],
  [
    'remove pedido da mesa',
    RemoveTableOrderUseCase,
    'removeTableOrder',
    { tableId: ' t1 ', orderId: ' o1 ' },
    ['admin-token', 't1', 'o1'],
  ],
];

for (const [name, UseCase, method, input, expectedArgs] of tableOperations) {
  test(`mesas: ${name} com os dados esperados`, async () => {
    const calls = [];
    const tables = {
      [method]: async (...args) => {
        calls.push(args);
        return 'ok';
      },
    };
    const useCase = new UseCase(tables, session);

    const result = input === undefined ? useCase.execute() : useCase.execute(input);
    assert.equal(await result, 'ok');
    assert.deepEqual(calls, [expectedArgs]);
  });
}

test('localiza a sessão do pedido e retorna null quando não encontra', async () => {
  const calls = [];
  const tables = {
    tableSessions: async (...args) => {
      calls.push(args);
      return {
        sessions: [
          { id: 's1', orders: [{ id: 'o1' }] },
          { id: 's2', orders: [{ id: 'o2' }] },
        ],
      };
    },
  };
  const useCase = new FindOrderSessionUseCase(tables, session);

  assert.equal(await useCase.execute({ tableId: ' t1 ', orderId: ' o2 ' }), 's2');
  assert.equal(await useCase.execute({ tableId: 't1', orderId: 'missing' }), null);
  assert.deepEqual(calls, [
    ['admin-token', 't1'],
    ['admin-token', 't1'],
  ]);
});

test('conta apenas pedidos ainda não concluídos', async () => {
  const table = {
    tableId: 't1',
    orders: [
      { status: 'PENDING' },
      { status: 'CONFIRMED' },
      { status: 'PREPARING' },
      { status: 'COMPLETED' },
      { status: 'CANCELED' },
    ],
  };
  const calls = [];
  const tables = {
    tableOrders: async (...args) => {
      calls.push(args);
      return table;
    },
  };

  const result = await new GetTableReleaseStatusUseCase(tables, session).execute({ tableId: ' t1 ' });
  assert.deepEqual(result, { table, unfinishedCount: 3 });
  assert.deepEqual(calls, [['admin-token', 't1']]);
});

test('impede liberar mesa com pedidos pendentes e libera quando zerar', async () => {
  const calls = [];
  let unfinishedCount = 2;
  const releaseStatus = { execute: async () => ({ unfinishedCount }) };
  const tables = {
    releaseTable: async (...args) => {
      calls.push(args);
      return { id: 't1', status: 'FREE' };
    },
  };
  const useCase = new ReleaseTableUseCase(tables, releaseStatus, session);

  await assert.rejects(useCase.execute({ tableId: ' t1 ' }), (error) => {
    assert.ok(error instanceof TableHasUnfinishedOrdersError);
    assert.equal(error.count, 2);
    return true;
  });
  assert.equal(calls.length, 0);

  unfinishedCount = 0;
  assert.deepEqual(await useCase.execute({ tableId: ' t1 ' }), { id: 't1', status: 'FREE' });
  assert.deepEqual(calls, [['admin-token', 't1']]);
});

test('validação e sessão ausente impedem chamadas ao gateway de mesas', () => {
  const calls = [];
  const tables = {
    tables: () => {
      calls.push('tables');
    },
    removeTableOrder: () => {
      calls.push('remove');
    },
  };

  assert.throws(() => new ListTablesUseCase(tables, { get: () => null }).execute(), AdminSessionNotFoundError);
  assert.throws(() => new RemoveTableOrderUseCase(tables, session).execute({ tableId: 't1', orderId: ' ' }), ValidationError);
  assert.deepEqual(calls, []);
});
