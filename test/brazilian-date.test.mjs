import test from 'node:test'
import assert from 'node:assert/strict'
import { BrazilianDate } from '../src/shared/formatters/brazilian-date.ts'

test('exibe e interpreta datas brasileiras sem alterar o dia da consulta', () => {
  assert.equal(BrazilianDate.format('2026-10-25'), '25/10/2026')
  assert.equal(BrazilianDate.parse('25/10/2026', '2026-10-25'), '2026-10-25')
  assert.equal(BrazilianDate.parse('29/02/2024', '2026-10-25'), '2024-02-29')
})

test('formata a digitação e rejeita datas impossíveis ou futuras', () => {
  assert.equal(BrazilianDate.mask('25102026'), '25/10/2026')
  assert.equal(BrazilianDate.mask('25/10/2026'), '25/10/2026')
  assert.equal(BrazilianDate.parse('31/04/2026', '2026-10-25'), null)
  assert.equal(BrazilianDate.parse('29/02/2025', '2026-10-25'), null)
  assert.equal(BrazilianDate.parse('26/10/2026', '2026-10-25'), null)
  assert.equal(BrazilianDate.parse('25/10/26', '2026-10-25'), null)
})

test('aceita colar uma data ISO no campo brasileiro', () => {
  const visibleDate = BrazilianDate.mask('2026-11-05')

  assert.equal(visibleDate, '05/11/2026')
  assert.equal(BrazilianDate.parse(visibleDate, '2026-11-05'), '2026-11-05')
})
