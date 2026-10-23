import test from 'node:test'
import assert from 'node:assert/strict'
import { cartTotal, toOrderPayload } from '../src/domain/cart.ts'
import { restaurantDateKey } from '../src/domain/order-date.ts'

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

test('calcula quantidade, preço do produto e adicionais', () => {
  assert.equal(cartTotal(cart), 37)
  assert.equal(cartTotal([]), 0)
})

test('gera pedido com nome e telefone limpos e adicionais associados', () => {
  assert.deepEqual(toOrderPayload('  Ana Silva  ', '(99) 99999-1234', cart), {
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
  assert.throws(() => toOrderPayload('', '99999991234', cart), /nome/i)
  assert.throws(() => toOrderPayload('Ana', '123', cart), /telefone/i)
  assert.throws(() => toOrderPayload('Ana', '99999991234', []), /produto/i)
})

test('filtra pelo dia de Imperatriz, inclusive nas horas próximas da meia-noite', () => {
  assert.equal(restaurantDateKey('2026-10-23T02:59:59.000Z'), '2026-10-22')
  assert.equal(restaurantDateKey('2026-10-23T03:00:00.000Z'), '2026-10-23')
  assert.equal(restaurantDateKey(new Date('2026-10-22T12:00:00Z')), '2026-10-22')
  assert.equal(restaurantDateKey('data inválida'), '')
})

test('mantém o filtro consistente em diferentes fusos horários do sistema', () => {
  const pedidos = [
    { id: 'ontem', createdAt: '2026-10-23T02:59:59Z' },
    { id: 'hoje', createdAt: '2026-10-23T03:00:00Z' },
    { id: 'amanha', createdAt: '2026-10-24T03:00:00Z' },
  ]
  assert.deepEqual(
    pedidos.filter(order => restaurantDateKey(order.createdAt) === '2026-10-23').map(order => order.id),
    ['hoje'],
  )
})
