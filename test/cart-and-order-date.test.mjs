import test from 'node:test'
import assert from 'node:assert/strict'
import { CartTotal } from '../src/application/utils/cart-total.ts'
import { OrderPayloadMapper } from '../src/application/mappers/order-payload.ts'
import { RestaurantDate } from '../src/application/utils/order-date.ts'
import { CartStorageAdapter } from '../src/infrastructure/storage/cart-storage.ts'
import { AddCartItemUseCase } from '../src/application/use-cases/cart/add-cart-item-use-case.ts'

const product = {
  id: 'p1',
  name: 'Pastel de carne',
  description: 'Pastel recheado',
  categoryId: 'c1',
  price: '12.50',
  available: true,
}
const addition = { id: 'a1', name: 'Queijo extra', price: '3.00', available: true }
const cart = [{
  key: 'p1:a1',
  product,
  quantity: 2,
  additions: [{ addition, quantity: 2 }],
}]

test('agrupa produtos com os mesmos adicionais independentemente da ordem', () => {
  const addItem = new AddCartItemUseCase()
  const bacon = { id: 'a2', name: 'Bacon', price: '4.00', available: true }
  const unavailable = { id: 'a3', name: 'Indisponível', price: '2.00', available: false }
  const first = addItem.execute({ cart: [], product, additions: [addition, bacon, unavailable], amounts: { a1: 1, a2: 2, a3: 1 }, quantity: 2 })
  const next = addItem.execute({ cart: first, product, additions: [bacon, addition], amounts: { a2: 2, a1: 1 }, quantity: 3 })

  assert.equal(next.length, 1)
  assert.equal(next[0].quantity, 5)
  assert.equal(next[0].key, 'p1:a1-1,a2-2')
  assert.deepEqual(next[0].additions.map(({ addition: item }) => item.id), ['a1', 'a2'])
  assert.equal(first[0].quantity, 2)
  assert.throws(() => addItem.execute({ cart: [], product, additions: [], amounts: {}, quantity: 0 }), /Quantidade/)
})

test('calcula quantidade, preço do produto e adicionais', () => {
  assert.equal(CartTotal.calculate(cart), 37)
  assert.equal(CartTotal.calculate([]), 0)
})

test('gera pedido com nome e telefone limpos e adicionais associados', () => {
  assert.deepEqual(OrderPayloadMapper.map('  Ana Silva  ', '(99) 99999-1234', cart), {
    customerName: 'Ana Silva',
    customerPhone: '99999991234',
    items: [{
      productId: 'p1',
      quantity: 2,
      additions: [{ additionId: 'a1', quantity: 2 }],
    }],
  })
})

test('não permite pedido sem nome, telefone válido ou produtos', () => {
  assert.throws(() => OrderPayloadMapper.map('', '99999991234', cart), /nome/i)
  assert.throws(() => OrderPayloadMapper.map('Ana', '123', cart), /telefone/i)
  assert.throws(() => OrderPayloadMapper.map('Ana', '99999991234', []), /produto/i)
})

test('filtra pelo dia de Imperatriz, inclusive nas horas próximas da meia-noite', () => {
  assert.equal(RestaurantDate.key('2026-10-23T02:59:59.000Z'), '2026-10-22')
  assert.equal(RestaurantDate.key('2026-10-23T03:00:00.000Z'), '2026-10-23')
  assert.equal(RestaurantDate.key(new Date('2026-10-22T12:00:00Z')), '2026-10-22')
  assert.equal(RestaurantDate.key('data inválida'), '')
})

test('mantém o filtro consistente em diferentes fusos horários do sistema', () => {
  const pedidos = [
    { id: 'ontem', createdAt: '2026-10-23T02:59:59Z' },
    { id: 'hoje', createdAt: '2026-10-23T03:00:00Z' },
    { id: 'amanha', createdAt: '2026-10-24T03:00:00Z' },
  ]
  assert.deepEqual(
    pedidos.filter(order => RestaurantDate.key(order.createdAt) === '2026-10-23').map(order => order.id),
    ['hoje'],
  )
})

test('preserva produtos, quantidades e adicionais no carrinho entre recarregamentos', () => {
  const previousStorage = globalThis.localStorage
  const store = new Map()
  globalThis.localStorage = {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => { store.set(key, value) },
    removeItem: key => { store.delete(key) },
  }
  try {
    const storage = new CartStorageAdapter()
    storage.save(cart)
    assert.deepEqual(storage.get(), cart)
    storage.save([])
    assert.deepEqual(storage.get(), [])
    assert.equal(store.size, 0)
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previousStorage
  }
})

test('ignora conteúdo inválido no armazenamento do carrinho', () => {
  const previousStorage = globalThis.localStorage
  const store = new Map([['trailer-pastel-cart-v1', '{invalido']])
  globalThis.localStorage = {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => { store.set(key, value) },
    removeItem: key => { store.delete(key) },
  }
  try {
    const storage = new CartStorageAdapter()
    assert.deepEqual(storage.get(), [])
    store.set('trailer-pastel-cart-v1', JSON.stringify([
      { ...cart[0], quantity: -3 },
      ...cart,
    ]))
    assert.deepEqual(storage.get(), cart)
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previousStorage
  }
})
