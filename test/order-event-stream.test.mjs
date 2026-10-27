import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeOrderEvent, ORDER_EVENT, ORDER_STREAM_READY } from '../src/infrastructure/http/order-event-stream.ts';

test('interpreta aviso de criação do backend', () => {
  assert.deepEqual(decodeOrderEvent('{"orderId":"pedido-1","status":"PENDING","tableId":null}'), {
    orderId: 'pedido-1', status: 'PENDING', tableId: null,
  });
});

test('interpreta aviso de status e cancelamento da mesa', () => {
  assert.deepEqual(decodeOrderEvent('{"orderId":"pedido-2","status":"CANCELED","tableId":"mesa-1"}'), {
    orderId: 'pedido-2', status: 'CANCELED', tableId: 'mesa-1',
  });
});

test('ignora frames inválidos sem alterar estado', () => {
  assert.equal(decodeOrderEvent(''), null);
  assert.equal(decodeOrderEvent('{"status":"COMPLETED"}'), null);
  assert.equal(decodeOrderEvent('not json'), null);
  assert.equal(decodeOrderEvent('null'), null);
});

test('eventos identificam somente invalidação; UI consulta a API', () => {
  assert.equal(ORDER_EVENT, 'trailer:order-event');
  assert.equal(ORDER_STREAM_READY, 'trailer:order-stream-ready');
});

test('aceita eventos de loja e mesas para invalidar GETs', () => {
  for (const type of ['STORE_OPENED', 'STORE_CLOSED', 'TABLE_CREATED', 'TABLE_ARCHIVED', 'TABLE_RELEASED']) {
    assert.deepEqual(decodeOrderEvent(JSON.stringify({ type, tableId: 'mesa-1' })), {
      type, tableId: 'mesa-1',
    });
  }
});
