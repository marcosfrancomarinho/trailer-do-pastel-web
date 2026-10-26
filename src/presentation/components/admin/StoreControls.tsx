import { useStoreControls } from '../../hooks/admin/useStoreControls';

export default function StoreControls() {
  const { store, busy, error, change, dialog } = useStoreControls();

  return (
    <section className='space-y-5 rounded-2xl border border-[#47778b] bg-[#112e43] p-5 text-white'>
      <h2 className='text-2xl font-black'>Funcionamento da loja</h2>
      <p className='text-slate-200'>Controle quando o cardápio aceita novos pedidos para retirada.</p>
      <div
        role='status'
        className={
          'rounded-xl border-2 p-5 ' +
          (store?.status === 'OPEN' ? 'border-green-400 bg-[#174635]' : 'border-amber-400 bg-[#4a3925]')
        }
      >
        <strong className='text-xl'>
          {store ? (store.status === 'OPEN' ? '🟢 Loja aberta' : '🔴 Loja fechada') : 'Consultando status...'}
        </strong>
        {store && (
          <p className='mt-2 text-sm text-slate-200'>
            Atualizado em {new Date(store.updatedAt).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' })}
          </p>
        )}
      </div>
      {error && (
        <p role='alert' className='rounded-lg bg-[#5f2835] p-3'>
          {error}
        </p>
      )}
      <div className='flex flex-wrap gap-3'>
        <button
          type='button'
          disabled={busy || !store || store.status === 'OPEN'}
          onClick={() => void change(true)}
          className='min-h-12 rounded-xl bg-green-300 px-5 font-black text-[#10382b] disabled:opacity-40'
        >
          Abrir loja
        </button>
        <button
          type='button'
          disabled={busy || !store || store.status === 'CLOSED'}
          onClick={() => void change(false)}
          className='min-h-12 rounded-xl bg-amber-300 px-5 font-black text-[#422910] disabled:opacity-40'
        >
          Fechar loja
        </button>
      </div>
      {dialog}
    </section>
  );
}
