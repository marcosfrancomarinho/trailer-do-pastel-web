import { useUserList } from '../../hooks/admin/useUserList';
import { usePrivateContext } from '../../hooks/global/usePrivateContext';

export default function UserList() {
  const { session } = usePrivateContext();
  const currentUserName = session?.name ?? '';
  const { users, busy, error, remove, dialog } = useUserList();

  return (
    <section className='space-y-4 text-white'>
      <h2 className='text-2xl font-black'>Gerenciar usuários</h2>
      <p className='text-sm text-slate-200'>Somente administradores podem listar ou excluir contas.</p>
      {error && (
        <p role='alert' className='rounded-xl bg-[#562c37] p-3'>
          {error}
        </p>
      )}
      {users.map((user) => (
        <article
          key={user.id}
          className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#51778b] bg-[#14374d] p-4'
        >
          <div>
            <strong className='block'>{user.name}</strong>
            <p className='text-sm text-slate-200'>{user.role === 'ADMIN' ? 'Administrador' : 'Funcionário'}</p>
          </div>
          {user.name !== currentUserName && (
            <button
              type='button'
              disabled={Boolean(busy)}
              onClick={() => void remove(user)}
              className='min-h-11 rounded-xl border border-red-300 bg-[#512832] px-4 text-sm font-bold text-white disabled:opacity-50'
            >
              Excluir
            </button>
          )}
        </article>
      ))}
      {users.length === 0 && !error && <p className='text-sm text-slate-200'>Nenhum usuário listado.</p>}
      {dialog}
    </section>
  );
}
