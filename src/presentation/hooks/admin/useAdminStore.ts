import { useEffect, useState } from 'react';
import { useApplicationServices } from '../global/useApplicationServices';
import type { StoreState } from '../../../application/dtos/store';
import { useActionDialog } from '../../components/shared/ActionDialog';

export function useAdminStore() {
  const useCases = useApplicationServices();
  const [store, setStore] = useState<StoreState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { confirm, notify, dialog } = useActionDialog();

  useEffect(() => {
    let active = true;
    useCases.store.getStatus
      .execute()
      .then((result) => {
        if (active) setStore(result);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Erro ao consultar loja.');
      });
    return () => {
      active = false;
    };
  }, []);

  async function change(open: boolean) {
    const approved = await confirm({
      title: open ? 'Abrir a loja?' : 'Fechar a loja?',
      message: open
        ? 'O cardápio voltará a aceitar pedidos dos clientes.'
        : 'Clientes não poderão enviar novos pedidos enquanto a loja estiver fechada.',
      confirmLabel: open ? 'Abrir loja' : 'Fechar loja',
    });
    if (!approved) return;
    setBusy(true);
    setError('');
    try {
      const next = await useCases.store.changeStatus.execute({ open });
      setStore(next);
      notify({
        title: open ? 'Loja aberta' : 'Loja fechada',
        message: open ? 'Os clientes já podem fazer pedidos.' : 'Novos pedidos públicos foram bloqueados.',
        tone: 'success',
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao alterar funcionamento.');
    } finally {
      setBusy(false);
    }
  }

  return { store, busy, error, change, dialog };
}
