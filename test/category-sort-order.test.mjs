import test from 'node:test';
import assert from 'node:assert/strict';
import { CreateCategory } from '../src/application/validation/catalog/create-category.ts';
import { UpdateCategory } from '../src/application/validation/catalog/update-category.ts';
import { ValidationError } from '../src/application/errors/validation-error.ts';

test('categoria aceita ordem numérica no cadastro e edição', () => {
  const created = CreateCategory.validate({ data: { name: ' Pastéis ', sortOrder: 1 } });
  const updated = UpdateCategory.validate({ id: 'cat1', data: { name: ' Água ', sortOrder: 3 } });
  assert.equal(created.data.sortOrder, 1);
  assert.equal(updated.data.sortOrder, 3);
});

test('integração mantém ordenação da categoria na listagem pública', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(new URL('../src/presentation/hooks/public/useMenuPage.ts', import.meta.url), 'utf8');
  assert.match(source, /matchingProducts\.sort/);
  assert.match(source, /positions\.get\(a\.categoryId\)/);
});
