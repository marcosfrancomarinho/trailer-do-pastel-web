import test from 'node:test';
import assert from 'node:assert/strict';
import { ListCategoriesUseCase } from '../src/application/use-cases/catalog/list-categories-use-case.ts';
import { ListProductsUseCase } from '../src/application/use-cases/catalog/list-products-use-case.ts';
import { ListAdditionsUseCase } from '../src/application/use-cases/catalog/list-additions-use-case.ts';
import { ListProductAdditionsUseCase } from '../src/application/use-cases/catalog/list-product-additions-use-case.ts';
import { ListCatalogUseCase } from '../src/application/use-cases/catalog/list-catalog-use-case.ts';
import { CreateProductUseCase } from '../src/application/use-cases/catalog/create-product-use-case.ts';
import { UpdateProductUseCase } from '../src/application/use-cases/catalog/update-product-use-case.ts';
import { RemoveProductUseCase } from '../src/application/use-cases/catalog/remove-product-use-case.ts';
import { CreateAdditionUseCase } from '../src/application/use-cases/catalog/create-addition-use-case.ts';
import { UpdateAdditionUseCase } from '../src/application/use-cases/catalog/update-addition-use-case.ts';
import { RemoveAdditionUseCase } from '../src/application/use-cases/catalog/remove-addition-use-case.ts';
import { CreateCategoryUseCase } from '../src/application/use-cases/catalog/create-category-use-case.ts';
import { UpdateCategoryUseCase } from '../src/application/use-cases/catalog/update-category-use-case.ts';
import { RemoveCategoryUseCase } from '../src/application/use-cases/catalog/remove-category-use-case.ts';
import { AdminSessionNotFoundError } from '../src/application/errors/admin-session-not-found-error.ts';
import { ValidationError } from '../src/application/errors/validation-error.ts';

const session = { get: () => ({ token: 'admin-token' }) };
const product = {
  name: ' Pastel ',
  description: ' Queijo ',
  price: ' 12.50 ',
  categoryId: ' cat-1 ',
  imageUrl: null,
  additionIds: [' extra-1 '],
  available: true,
};
const cleanProduct = {
  name: 'Pastel',
  description: 'Queijo',
  price: '12.50',
  categoryId: 'cat-1',
  imageUrl: null,
  additionIds: ['extra-1'],
  available: true,
};
const addition = { name: ' Queijo ', price: ' 3.00 ', available: true };
const category = { name: ' Pastéis ' };

test('lista categorias e produtos em paralelo e junta os resultados', async () => {
  const started = [];
  let resolveCategories;
  let resolveProducts;
  const catalog = {
    categories: () => {
      started.push('categories');
      return new Promise((resolve) => {
        resolveCategories = resolve;
      });
    },
    products: () => {
      started.push('products');
      return new Promise((resolve) => {
        resolveProducts = resolve;
      });
    },
  };
  const useCase = new ListCatalogUseCase(new ListCategoriesUseCase(catalog), new ListProductsUseCase(catalog));

  const result = useCase.execute();
  assert.deepEqual(started, ['categories', 'products']);
  resolveCategories([{ id: 'cat-1', name: 'Pastéis' }]);
  resolveProducts([{ id: 'p1', name: 'Pastel' }]);
  assert.deepEqual(await result, {
    categories: [{ id: 'cat-1', name: 'Pastéis' }],
    products: [{ id: 'p1', name: 'Pastel' }],
  });
});

test('lista adicionais e usa o ID formatado ao buscar por produto', async () => {
  const calls = [];
  const additions = [{ id: 'extra-1', name: 'Queijo' }];
  const catalog = {
    allAdditions: async () => additions,
    additions: async (id) => {
      calls.push(id);
      return additions;
    },
  };

  assert.deepEqual(await new ListAdditionsUseCase(catalog).execute(), additions);
  assert.deepEqual(await new ListProductAdditionsUseCase(catalog).execute(' p1 '), additions);
  assert.deepEqual(calls, ['p1']);
  assert.throws(() => new ListProductAdditionsUseCase(catalog).execute(' '), ValidationError);
  assert.deepEqual(calls, ['p1']);
});

const mutations = [
  ['cria produto', CreateProductUseCase, 'createProduct', { data: product }, ['admin-token', cleanProduct]],
  ['atualiza produto', UpdateProductUseCase, 'updateProduct', { id: ' p1 ', data: product }, ['p1', 'admin-token', cleanProduct]],
  ['remove produto', RemoveProductUseCase, 'removeProduct', { id: ' p1 ' }, ['p1', 'admin-token']],
  [
    'cria adicional',
    CreateAdditionUseCase,
    'createAddition',
    { data: addition },
    ['admin-token', { name: 'Queijo', price: '3.00', available: true }],
  ],
  [
    'atualiza adicional',
    UpdateAdditionUseCase,
    'updateAddition',
    { id: ' a1 ', data: addition },
    ['a1', 'admin-token', { name: 'Queijo', price: '3.00', available: true }],
  ],
  ['remove adicional', RemoveAdditionUseCase, 'removeAddition', { id: ' a1 ' }, ['a1', 'admin-token']],
  ['cria categoria', CreateCategoryUseCase, 'createCategory', { data: category }, ['admin-token', { name: 'Pastéis' }]],
  [
    'atualiza categoria',
    UpdateCategoryUseCase,
    'updateCategory',
    { id: ' c1 ', data: category },
    ['c1', 'admin-token', { name: 'Pastéis' }],
  ],
  ['remove categoria', RemoveCategoryUseCase, 'removeCategory', { id: ' c1 ' }, ['c1', 'admin-token']],
];

for (const [name, UseCase, method, input, expectedArgs] of mutations) {
  test(`catálogo ${name} com token e dados formatados`, async () => {
    const calls = [];
    const catalog = {
      [method]: async (...args) => {
        calls.push(args);
        return 'ok';
      },
    };
    const result = await new UseCase(catalog, session).execute(input);

    assert.equal(result, 'ok');
    assert.deepEqual(calls, [expectedArgs]);
  });
}

test('cadastro protegido não chama gateway sem sessão', () => {
  let called = false;
  const catalog = {
    createCategory: () => {
      called = true;
    },
  };
  const useCase = new CreateCategoryUseCase(catalog, { get: () => null });

  assert.throws(() => useCase.execute({ data: category }), AdminSessionNotFoundError);
  assert.equal(called, false);
});
