import test from 'node:test';
import assert from 'node:assert/strict';
import { ValidationError } from '../src/application/errors/validation-error.ts';

const validation = async (area, name) => {
  const module = await import(`../src/application/validation/${area}/${name}.ts`);
  const className = name.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join('');
  return module[className];
};

const rejectsField = (run, field) => assert.throws(run, (error) => {
  assert.ok(error instanceof ValidationError);
  assert.equal(error.field, field);
  assert.ok(error.message.length > 0);
  return true;
});

const product = () => ({
  name: ' Pastel ', description: ' Queijo ', price: ' 12.50 ', categoryId: ' cat-1 ',
  imageUrl: ' https://example.com/a.png ', additionIds: [' extra-1 '], available: false,
});
const addition = () => ({ name: ' Queijo ', price: ' 3.00 ', available: false });
const category = () => ({ name: ' Pastéis ' });

for (const [kind, fixture, fields] of [
  ['product', product, [
    ['name', undefined], ['name', ' '], ['description', null], ['price', 12], ['price', ' '],
    ['price', 'Infinity'], ['price', '0'], ['price', '-1'], ['categoryId', 1], ['categoryId', ' '],
    ['imageUrl', undefined], ['imageUrl', ' '], ['additionIds', null],
    ['additionIds', [1]], ['additionIds', [' ']], ['available', 'false'],
  ]],
  ['addition', addition, [
    ['name', null], ['name', ' '], ['price', 3], ['price', ' '], ['price', 'NaN'],
    ['price', '0'], ['price', '-1'], ['available', 0],
  ]],
  ['category', category, [['name', 1], ['name', ' ']]],
]) {
  for (const action of ['create', 'update']) {
    test(`${action}-${kind}: valida todos os campos e preserva a entrada`, async () => {
      const Validator = await validation('catalog', `${action}-${kind}`);
      const base = action === 'update' ? { id: ' item-1 ', data: fixture() } : { data: fixture() };
      rejectsField(() => Validator.validate(null), 'input');
      if (action === 'update') {
        rejectsField(() => Validator.validate({ ...base, id: 1 }), 'id');
        rejectsField(() => Validator.validate({ ...base, id: ' ' }), 'id');
      }
      rejectsField(() => Validator.validate({ ...base, data: null }), 'data');
      for (const [field, value] of fields) {
        rejectsField(() => Validator.validate({ ...base, data: { ...base.data, [field]: value } }), `data.${field}${field === 'additionIds' && Array.isArray(value) ? '[0]' : ''}`);
      }
      const original = structuredClone(base);
      const result = Validator.validate(base);
      assert.deepEqual(base, original);
      assert.notEqual(result, base);
      assert.notEqual(result.data, base.data);
      assert.equal(result.data.name, fixture().name.trim());
      if (action === 'update') assert.equal(result.id, 'item-1');
      if (kind === 'product') {
        assert.deepEqual(result.data.additionIds, ['extra-1']);
        assert.equal(result.data.imageUrl, 'https://example.com/a.png');
        assert.equal(Validator.validate({ ...base, data: { ...base.data, imageUrl: null } }).data.imageUrl, null);
      }
      if (kind !== 'category') assert.equal(result.data.price, fixture().price.trim());
    });
  }
  test(`remove-${kind}: exige ID textual e elimina espaços`, async () => {
    const Validator = await validation('catalog', `remove-${kind}`);
    rejectsField(() => Validator.validate(null), 'input');
    rejectsField(() => Validator.validate({ id: 7 }), 'id');
    rejectsField(() => Validator.validate({ id: ' ' }), 'id');
    assert.deepEqual(Validator.validate({ id: ' item-1 ' }), { id: 'item-1' });
  });
}

test('list-product-additions: exige ID e formata sem alterar a string original', async () => {
  const Validator = await validation('catalog', 'list-product-additions');
  for (const value of [null, 1, ' ']) rejectsField(() => Validator.validate(value), 'productId');
  assert.equal(Validator.validate(' p1 '), 'p1');
});

const cartItem = () => ({
  key: ' item-1 ', product: { id: ' p1 ', name: ' Pastel ', price: ' 12.50 ' }, quantity: 2,
  additions: [{ addition: { id: ' a1 ', name: ' Queijo ', price: ' 2.00 ' }, quantity: 1 }],
});

const cartErrors = [
  [(item) => null, ''],
  [(item) => ({ ...item, key: 1 }), '.key'],
  [(item) => ({ ...item, key: ' ' }), '.key'],
  [(item) => ({ ...item, product: null }), '.product'],
  ...['id', 'name', 'price'].flatMap((field) => [
    [(item) => ({ ...item, product: { ...item.product, [field]: null } }), `.product.${field}`],
    [(item) => ({ ...item, product: { ...item.product, [field]: ' ' } }), `.product.${field}`],
  ]),
  ...['NaN', '-1'].map((price) => [(item) => ({ ...item, product: { ...item.product, price } }), '.product.price']),
  ...[0, 1.5, Number.MAX_SAFE_INTEGER + 1].map((quantity) => [(item) => ({ ...item, quantity }), '.quantity']),
  [(item) => ({ ...item, additions: null }), '.additions'],
  [(item) => ({ ...item, additions: [null] }), '.additions[0]'],
  [(item) => ({ ...item, additions: [{ quantity: 1 }] }), '.additions[0].addition'],
  ...['id', 'name', 'price'].flatMap((field) => [
    [(item) => ({ ...item, additions: [{ ...item.additions[0], addition: { ...item.additions[0].addition, [field]: null } }] }), `.additions[0].addition.${field}`],
    [(item) => ({ ...item, additions: [{ ...item.additions[0], addition: { ...item.additions[0].addition, [field]: ' ' } }] }), `.additions[0].addition.${field}`],
  ]),
  ...['NaN', '-1'].map((price) => [(item) => ({ ...item, additions: [{ ...item.additions[0], addition: { ...item.additions[0].addition, price } }] }), '.additions[0].addition.price']),
  ...[0, 1.5, Number.MAX_SAFE_INTEGER + 1].map((quantity) => [(item) => ({ ...item, additions: [{ ...item.additions[0], quantity }] }), '.additions[0].quantity']),
];

test('save-cart: valida itens e adicionais em qualquer posição, normaliza e não muta', async () => {
  const Validator = await validation('cart', 'save-cart');
  rejectsField(() => Validator.validate(null), 'items');
  assert.deepEqual(Validator.validate([]), []);
  for (const [change, suffix] of cartErrors) {
    const input = [cartItem(), change(cartItem())];
    rejectsField(() => Validator.validate(input), `items[1]${suffix}`);
  }
  const input = [cartItem()];
  const original = structuredClone(input);
  const result = Validator.validate(input);
  assert.deepEqual(input, original);
  assert.equal(result[0].key, 'item-1');
  assert.deepEqual(result[0].product, { id: 'p1', name: 'Pastel', price: '12.50' });
  assert.deepEqual(result[0].additions[0].addition, { id: 'a1', name: 'Queijo', price: '2.00' });
});

for (const [name, extra] of [['create-order', {}], ['create-table-order', { tableId: ' mesa-1 ' }]]) {
  test(`${name}: valida cliente, carrinho completo e normaliza sem mutação`, async () => {
    const Validator = await validation('orders', name);
    const base = { ...extra, customerName: ' Ana ', customerPhone: '(99) 99999-1234', observation: ' Sem cebola ', cart: [cartItem()] };
    rejectsField(() => Validator.validate(null), 'input');
    if (name === 'create-table-order') {
      for (const value of [null, ' ']) rejectsField(() => Validator.validate({ ...base, tableId: value }), 'tableId');
    }
    for (const [field, values] of [
      ['customerName', [null, ' ']], ['customerPhone', [null, '123', 'abcdefghij', '+55 99 99999-1234']],
      ['cart', [null, []]], ['observation', [null]],
    ]) for (const value of values) rejectsField(() => Validator.validate({ ...base, [field]: value }), field);
    for (const [change, suffix] of cartErrors) {
      rejectsField(() => Validator.validate({ ...base, cart: [cartItem(), change(cartItem())] }), `cart[1]${suffix}`);
    }
    const original = structuredClone(base);
    const result = Validator.validate(base);
    assert.deepEqual(base, original);
    assert.equal(result.customerName, 'Ana');
    assert.equal(result.customerPhone, '99999991234');
    assert.equal(result.observation, 'Sem cebola');
    assert.equal(result.cart[0].product.id, 'p1');
    if (name === 'create-table-order') assert.equal(result.tableId, 'mesa-1');
  });
}

for (const [area, names] of [
  ['orders', ['list-order-history', 'list-pending-orders', 'list-preparing-orders']],
  ['tables', ['list-closed-comandas']],
]) for (const name of names) {
  test(`${name}: datas reais, ano bissexto e filtro opcional`, async () => {
    const Validator = await validation(area, name);
    rejectsField(() => Validator.validate(null), 'input');
    for (const value of [null, 1, '', '2026-2-28', '2026-02-30', '2025-02-29', '2026-13-01']) {
      rejectsField(() => Validator.validate({ date: value }), 'date');
    }
    assert.deepEqual(Validator.validate({}), {});
    assert.deepEqual(Validator.validate({ date: ' 2024-02-29 ' }), { date: '2024-02-29' });
  });
}

for (const name of ['archive-table', 'get-table-release-status', 'list-table-orders', 'list-table-sessions', 'release-table']) {
  test(`${name}: exige e normaliza ID da mesa`, async () => {
    const Validator = await validation('tables', name);
    rejectsField(() => Validator.validate(null), 'input');
    for (const value of [null, 1, ' ']) rejectsField(() => Validator.validate({ tableId: value }), 'tableId');
    assert.deepEqual(Validator.validate({ tableId: ' t1 ' }), { tableId: 't1' });
  });
}

for (const name of ['find-order-session', 'remove-table-order']) {
  test(`${name}: valida ambos os IDs independentemente`, async () => {
    const Validator = await validation('tables', name);
    const base = { tableId: ' t1 ', orderId: ' o1 ' };
    rejectsField(() => Validator.validate(null), 'input');
    for (const field of ['tableId', 'orderId']) {
      for (const value of [null, 1, ' ']) rejectsField(() => Validator.validate({ ...base, [field]: value }), field);
    }
    assert.deepEqual(Validator.validate(base), { tableId: 't1', orderId: 'o1' });
    assert.deepEqual(base, { tableId: ' t1 ', orderId: ' o1 ' });
  });
}

test('create-table: aceita apenas inteiros positivos seguros', async () => {
  const Validator = await validation('tables', 'create-table');
  rejectsField(() => Validator.validate(null), 'input');
  for (const number of [null, '1', 1.5, Number.MAX_SAFE_INTEGER + 1, 0, -1]) {
    rejectsField(() => Validator.validate({ number }), 'number');
  }
  assert.deepEqual(Validator.validate({ number: 1 }), { number: 1 });
});

for (const [area, name, valid, cases, expected] of [
  ['auth', 'sign-in', { name: ' Admin ', password: ' senha ' }, [
    ['name', null], ['name', ' '], ['password', null], ['password', ''],
  ], { name: 'Admin', password: ' senha ' }],
  ['users', 'create-user', { name: ' Admin ', password: '12345678' }, [
    ['name', null], ['name', ' '], ['password', null], ['password', '1234567'],
  ], { name: 'Admin', password: '12345678' }],
  ['users', 'remove-user', { userId: ' u1 ' }, [['userId', null], ['userId', ' ']], { userId: 'u1' }],
  ['store', 'change-store-status', { open: false }, [['open', null], ['open', 'false']], { open: false }],
]) {
  test(`${name}: entradas inválidas e formato do retorno`, async () => {
    const Validator = await validation(area, name);
    rejectsField(() => Validator.validate(null), 'input');
    for (const [field, value] of cases) rejectsField(() => Validator.validate({ ...valid, [field]: value }), field);
    assert.deepEqual(Validator.validate(valid), expected);
    assert.notEqual(Validator.validate(valid), valid);
  });
}

test('set-sound-preference: só aceita booleanos', async () => {
  const Validator = await validation('notifications', 'set-sound-preference');
  for (const value of [null, undefined, 0, 'false']) rejectsField(() => Validator.validate(value), 'enabled');
  assert.equal(Validator.validate(true), true);
  assert.equal(Validator.validate(false), false);
});

test('update-order-status: aceita apenas transições nomeadas pelo contrato', async () => {
  const Validator = await validation('orders', 'update-order-status');
  rejectsField(() => Validator.validate(null), 'input');
  for (const orderId of [null, ' ']) rejectsField(() => Validator.validate({ orderId, status: 'CONFIRMED' }), 'orderId');
  for (const status of [null, 'PENDING', 'confirmed', 'UNKNOWN', ' ']) {
    rejectsField(() => Validator.validate({ orderId: 'o1', status }), 'status');
  }
  for (const status of ['CONFIRMED', 'PREPARING', 'COMPLETED', 'CANCELED']) {
    assert.deepEqual(Validator.validate({ orderId: ' o1 ', status: ` ${status} ` }), { orderId: 'o1', status });
  }
});

test('track-order: valida o token e o contrato do AbortSignal', async () => {
  const Validator = await validation('orders', 'track-order');
  rejectsField(() => Validator.validate(null), 'input');
  for (const trackingToken of [null, 1, ' ']) rejectsField(() => Validator.validate({ trackingToken }), 'trackingToken');
  for (const signal of [null, 1, {}, { aborted: false }, { aborted: false, addEventListener: true }]) {
    rejectsField(() => Validator.validate({ trackingToken: 'abc', signal }), 'signal');
  }
  const signal = new AbortController().signal;
  assert.equal(Validator.validate({ trackingToken: ' abc ', signal }).signal, signal);
  assert.deepEqual(Validator.validate({ trackingToken: ' abc ' }), { trackingToken: 'abc' });
});

test('remove-saved-order: token de acompanhamento é obrigatório', async () => {
  const Validator = await validation('orders', 'remove-saved-order');
  for (const value of [null, 1, ' ']) rejectsField(() => Validator.validate(value), 'trackingToken');
  assert.equal(Validator.validate(' abc '), 'abc');
});
