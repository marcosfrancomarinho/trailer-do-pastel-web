import { useEffect, useState } from 'react';
import { useApplicationServices } from '../global/useApplicationServices';
import type { RestaurantUser } from '../../../application/dtos/users';
import { useActionDialog } from '../../components/shared/ActionDialog';
import { usePrivateContext } from '../global/usePrivateContext';

export function useAdminUsers() {
  const useCases = useApplicationServices();
  const { session } = usePrivateContext();
  const token = session?.token ?? '';
  const [users, setUsers] = useState<RestaurantUser[]>([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const { confirm, notify, dialog } = useActionDialog();

  async function refresh() {
    setError('');
    try {
      setUsers(await useCases.users.list.execute());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao consultar usuários.');
    }
  }
  useEffect(() => {
    void refresh();
  }, [token]);

  async function remove(user: RestaurantUser) {
    if (
      !(await confirm({
        title: 'Excluir usuário?',
        message: 'O usuário ' + user.name + ' perderá acesso ao painel.',
        confirmLabel: 'Excluir usuário',
        tone: 'warning',
      }))
    )
      return;
    setBusy(user.id);
    try {
      await useCases.users.remove.execute({ userId: user.id });
      await refresh();
      notify({ title: 'Usuário excluído', message: user.name + ' foi removido.', tone: 'success' });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao excluir usuário.');
    } finally {
      setBusy('');
    }
  }

  return { users, busy, error, remove, dialog };
}
