import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { brl } from '../../../shared/formatters/currency';
import type { StoreState } from '../../../application/dtos/store';

type Props = {
  total: number;
  customerName: string;
  setCustomerName: Dispatch<SetStateAction<string>>;
  customerPhone: string;
  setCustomerPhone: Dispatch<SetStateAction<string>>;
  observation: string;
  setObservation: Dispatch<SetStateAction<string>>;
  storeState: StoreState | null;
  error: string;
  sending: boolean;
  checkout: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export default function CheckoutForm({
  total,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  observation,
  setObservation,
  storeState,
  error,
  sending,
  checkout,
}: Props) {
  return (
    <form onSubmit={(event) => void checkout(event)} className='h-fit space-y-4 rounded-3xl bg-white p-6 shadow-sm'>
      <h2 className='text-xl font-black'>Finalizar pedido</h2>
      <label className='block text-sm font-semibold'>
        Seu nome
        <input
          required
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          className='mt-2 w-full rounded-xl border border-cyan-100 p-3 outline-cyan-400'
          placeholder='Como podemos chamar você?'
        />
      </label>
      <label className='block text-sm font-semibold'>
        Telefone
        <input
          required
          type='tel'
          value={customerPhone}
          onChange={(event) => setCustomerPhone(event.target.value)}
          className='mt-2 w-full rounded-xl border border-cyan-100 p-3 outline-cyan-400'
          placeholder='(99) 99999-9999'
        />
      </label>
      <label className='block text-sm font-semibold'>
        Observações do pedido (opcional)
        <textarea
          rows={3}
          maxLength={500}
          value={observation}
          onChange={(event) => setObservation(event.target.value)}
          className='mt-2 w-full rounded-xl border border-cyan-100 bg-white p-3 text-[#102c40]'
          placeholder='Ex.: Sem cebola, pouco sal...'
        />
      </label>
      {storeState?.status === 'CLOSED' && (
        <p role='alert' className='checkout-closed-notice rounded-xl p-4 text-sm font-bold'>
          A loja está fechada e não está aceitando pedidos no momento.
        </p>
      )}
      <div className='flex justify-between border-t border-cyan-100 pt-4 text-lg'>
        <span>Total estimado</span>
        <strong>{brl(total)}</strong>
      </div>
      <p className='text-xs text-[#557383]'>O preço final será validado pela pastelaria no servidor.</p>
      {error && (
        <p role='alert' className='text-sm text-red-600'>
          {error}
        </p>
      )}
      <button
        disabled={sending || storeState?.status === 'CLOSED'}
        className='w-full rounded-full bg-[#ffc629] py-4 font-black text-[#113548] disabled:opacity-60'
      >
        {sending ? 'Enviando pedido...' : 'Confirmar pedido →'}
      </button>
    </form>
  );
}
