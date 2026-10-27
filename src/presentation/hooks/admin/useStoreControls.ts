import { useEffect, useState } from 'react';
import { useApplicationServices } from '../global/useApplicationServices';
import type { StoreState } from '../../../application/dtos/store';
import { useActionDialog } from '../../components/shared/ActionDialog';
import { ORDER_EVENT, ORDER_STREAM_READY } from '../../../infrastructure/http/order-event-stream';

export function useStoreControls() {
  const useCases = useApplicationServices();
  const [store, setStore] = useState<StoreState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { confirm, notify, dialog } = useActionDialog();

  useEffect(() => {
    let active = true;

    async function loadStoreStatus() {
      try {
        const currentStore = await useCases.store.getStatus.execute();
        if (active) setStore(currentStore);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Erro ao consultar loja.');
      }
    }

    void loadStoreStatus();
    const onChange = (event: Event) => {
      if (event.type === ORDER_STREAM_READY || (event instanceof CustomEvent && ['STORE_OPENED', 'STORE_CLOSED'].includes(event.detail?.type))) {
        void loadStoreStatus();
      }
    };
    window.addEventListener(ORDER_EVENT, onChange);
    window.addEventListener(ORDER_STREAM_READY, onChange);
    window.addEventListener('focus', loadStoreStatus);
    return () => {
      active = false;
      window.removeEventListener(ORDER_EVENT, onChange);
      window.removeEventListener(ORDER_STREAM_READY, onChange);
      window.removeEventListener('focus', loadStoreStatus);
    };
  }, [useCases]);

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
      const updatedStore = await useCases.store.changeStatus.execute({ open });
      setStore(updatedStore);
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
