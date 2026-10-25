import test from 'node:test';
import assert from 'node:assert/strict';
import { GetCartUseCase } from '../src/application/use-cases/cart/get-cart-use-case.ts';
import { GetCustomerInfoUseCase } from '../src/application/use-cases/customer/get-customer-info-use-case.ts';
import { GetSoundPreferenceUseCase } from '../src/application/use-cases/notifications/get-sound-preference-use-case.ts';
import { SetSoundPreferenceUseCase } from '../src/application/use-cases/notifications/set-sound-preference-use-case.ts';
import { GetStoreStatusUseCase } from '../src/application/use-cases/store/get-store-status-use-case.ts';
import { ChangeStoreStatusUseCase } from '../src/application/use-cases/store/change-store-status-use-case.ts';
import { ListUsersUseCase } from '../src/application/use-cases/users/list-users-use-case.ts';
import { CreateUserUseCase } from '../src/application/use-cases/users/create-user-use-case.ts';
import { RemoveUserUseCase } from '../src/application/use-cases/users/remove-user-use-case.ts';
import { AdminSessionNotFoundError } from '../src/application/errors/admin-session-not-found-error.ts';
import { ValidationError } from '../src/application/errors/validation-error.ts';

const session = { get: () => ({ token: 'admin-token' }) };

test('use cases de leitura retornam os valores dos gateways', async () => {
  const cart = [{ key: 'item-1' }];
  const customer = { name: 'Ana', phone: '99999991234' };
  const store = { status: 'OPEN', updatedAt: '2026-10-25T12:00:00Z' };
  const users = [{ id: 'u1', name: 'Ana' }];
  const calls = [];

  assert.equal(new GetCartUseCase({ get: () => cart }).execute(), cart);
  assert.equal(new GetCustomerInfoUseCase({ get: () => customer }).execute(), customer);
  assert.equal(new GetSoundPreferenceUseCase({ isSoundEnabled: () => false }).execute(), false);
  assert.equal(await new GetStoreStatusUseCase({ storeStatus: async () => store }).execute(), store);
  const listUsers = new ListUsersUseCase(
    {
      users: async (token) => {
        calls.push(token);
        return users;
      },
    },
    session,
  );
  assert.equal(await listUsers.execute(), users);
  assert.deepEqual(calls, ['admin-token']);
});

test('preferência de som aceita false e rejeita valores não booleanos', () => {
  const calls = [];
  const useCase = new SetSoundPreferenceUseCase({ setSoundEnabled: (enabled) => calls.push(enabled) });

  useCase.execute(false);
  assert.throws(() => useCase.execute('off'), ValidationError);
  assert.deepEqual(calls, [false]);
});

test('loja recebe estado false com token da sessão', async () => {
  const calls = [];
  const store = {
    setStoreOpen: async (...args) => {
      calls.push(args);
      return { status: 'CLOSED' };
    },
  };
  const useCase = new ChangeStoreStatusUseCase(store, session);

  assert.deepEqual(await useCase.execute({ open: false }), { status: 'CLOSED' });
  assert.deepEqual(calls, [['admin-token', false]]);
  assert.throws(() => useCase.execute({ open: 'false' }), ValidationError);
  assert.equal(calls.length, 1);
});

test('usuários são criados e removidos com dados formatados', async () => {
  const calls = [];
  const users = {
    createUser: async (...args) => {
      calls.push(['create', ...args]);
      return { id: 'u1' };
    },
    removeUser: async (...args) => {
      calls.push(['remove', ...args]);
      return undefined;
    },
  };

  assert.deepEqual(await new CreateUserUseCase(users, session).execute({ name: ' Ana ', password: 'senha123' }), { id: 'u1' });
  await new RemoveUserUseCase(users, session).execute({ userId: ' u1 ' });
  assert.deepEqual(calls, [
    ['create', 'admin-token', { name: 'Ana', password: 'senha123' }],
    ['remove', 'admin-token', 'u1'],
  ]);
  assert.throws(() => new CreateUserUseCase(users, session).execute({ name: 'Ana', password: '123' }), ValidationError);
  assert.equal(calls.length, 2);
});

test('operações protegidas de loja e usuários exigem sessão', () => {
  const noSession = { get: () => null };
  let called = false;
  const store = {
    setStoreOpen: () => {
      called = true;
    },
  };
  const users = {
    users: () => {
      called = true;
    },
  };

  assert.throws(() => new ChangeStoreStatusUseCase(store, noSession).execute({ open: true }), AdminSessionNotFoundError);
  assert.throws(() => new ListUsersUseCase(users, noSession).execute(), AdminSessionNotFoundError);
  assert.equal(called, false);
});
