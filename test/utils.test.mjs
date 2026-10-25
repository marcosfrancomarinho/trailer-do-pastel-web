import test from 'node:test';
import assert from 'node:assert/strict';
import { authHeaders, queryDate, tablePath } from '../src/infrastructure/http/http-helpers.ts';
import { brl } from '../src/shared/formatters/currency.ts';
import { RestaurantDate } from '../src/application/utils/order-date.ts';

test('monta cabeçalho e caminhos HTTP sem perder caracteres especiais', () => {
  assert.deepEqual(authHeaders('token-1'), { Authorization: 'Bearer token-1' });
  assert.equal(queryDate(), '');
  assert.equal(queryDate('2026-10-25'), '?date=2026-10-25');
  assert.equal(queryDate('a&b'), '?date=a%26b');
  assert.equal(tablePath('mesa/1'), '/tables/mesa%2F1');
});

test('formata valores numéricos e texto em reais', () => {
  assert.match(brl(12.5), /R\$\s*12,50/);
  assert.match(brl('3.00'), /R\$\s*3,00/);
});

test('data de hoje usa o fuso da pastelaria', () => {
  const OriginalDate = globalThis.Date;
  globalThis.Date = class extends OriginalDate {
    constructor(...args) {
      super(...(args.length ? args : ['2026-10-23T02:30:00.000Z']));
    }
  };

  try {
    assert.equal(RestaurantDate.today(), '2026-10-22');
  } finally {
    globalThis.Date = OriginalDate;
  }
});
