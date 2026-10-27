import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { decodeOrderEvent } from '../src/infrastructure/http/order-event-stream.ts';

const source = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('SSE: evento de pedido preserva status e mesa', () => {
  assert.deepEqual(decodeOrderEvent(JSON.stringify({ orderId: 'o1', status: 'COMPLETED', tableId: 't1' })), {
    orderId: 'o1', status: 'COMPLETED', tableId: 't1',
  });
  assert.deepEqual(decodeOrderEvent(JSON.stringify({ type: 'TABLE_RELEASED', tableId: 't1' })), {
    type: 'TABLE_RELEASED', tableId: 't1',
  });
  assert.equal(decodeOrderEvent('not-json'), null);
  assert.equal(decodeOrderEvent(JSON.stringify({ status: 'COMPLETED' })), null);
});

test('pedidos: mudança de status não ativa loading geral e sincroniza após confirmação', () => {
  const hook = source('src/presentation/hooks/admin/useOrderBoard.ts');
  const operation = hook.slice(hook.indexOf('const changeStatus ='), hook.indexOf('// Busca global:', hook.indexOf('const changeStatus =')));
  assert.match(operation, /await useCases\.orders\.updateStatus\.execute/);
  assert.match(operation, /setPending\(\(previous\) => previous\.filter/);
  assert.match(operation, /invalidateOrderQueries\(\)/);
  assert.doesNotMatch(operation, /setLoading\(true\)/);
  assert.doesNotMatch(operation, /await refresh\(\)/);
});

test('usuários e mesas: exclusão bem sucedida modifica lista local', () => {
  const users = source('src/presentation/hooks/admin/useUserList.ts');
  const tables = source('src/presentation/hooks/admin/useTableOverview.ts');
  assert.match(users, /setUsers\(\(previous\) => previous\.filter/);
  assert.match(tables, /setTables\(\(previous\) => previous\.filter/);
});

test('som: inicialização ocorre no gesto do login antes de autenticar', () => {
  const hook = source('src/presentation/hooks/admin/usePainelAdminPage.ts');
  const login = hook.slice(hook.indexOf('async function login('), hook.indexOf('function onSeeOrders('));
  const unlock = login.indexOf('orderAlert.enable()');
  const signIn = login.indexOf('auth.signIn.execute');
  assert.ok(unlock >= 0 && signIn > unlock);
});

test('Web Push removido sem interferir no SSE', () => {
  for (const file of ['public/push-sw.js', 'src/infrastructure/http/customer-push.ts']) {
    assert.equal(existsSync(new URL('../' + file, import.meta.url)), false);
  }
  assert.doesNotMatch(source('src/presentation/hooks/public/useCustomerOrdersPage.ts'), /registerOrderPush|Notification\.requestPermission/);
  assert.match(source('src/presentation/hooks/public/useCustomerOrdersPage.ts'), /new EventSource/);
  assert.match(source('src/presentation/components/public/CustomerOrderList.tsx'), /orders\.map\(\(order\)/);
});
