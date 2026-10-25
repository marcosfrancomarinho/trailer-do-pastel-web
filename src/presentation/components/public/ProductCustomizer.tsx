import type { Dispatch, SetStateAction } from 'react';
import { brl } from '../../../shared/formatters/currency';
import type { Addition, Product } from '../../../application/dtos/catalog';

type Props = {
  selected: Product | null;
  extras: Addition[];
  extrasBusy: boolean;
  amounts: Record<string, number>;
  setAmounts: Dispatch<SetStateAction<Record<string, number>>>;
  quantity: number;
  setQuantity: Dispatch<SetStateAction<number>>;
  addItem: () => void;
  onClose: () => void;
};

export default function ProductCustomizer({
  selected,
  extras,
  extrasBusy,
  amounts,
  setAmounts,
  quantity,
  setQuantity,
  addItem,
  onClose,
}: Props) {
  if (!selected) return null;
  return (
    <div
      role='presentation'
      className='fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-4'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role='dialog'
        aria-modal='true'
        aria-label={'Personalizar ' + selected.name}
        className='product-customizer-modal flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-[#608ba0] bg-[#102c40] text-white shadow-2xl sm:max-h-[90dvh] sm:rounded-3xl'
      >
        <header className='flex shrink-0 items-start justify-between gap-3 border-b border-[#41687c] px-5 py-5 sm:px-7'>
          <div className='min-w-0'>
            <p className='text-xs font-black tracking-wider text-[#8be9fb]'>MONTE DO SEU JEITO</p>
            <h2 className='mt-2 break-words text-2xl font-black leading-tight text-white sm:text-3xl'>{selected.name}</h2>
            <p className='mt-2 text-sm font-semibold leading-relaxed text-[#d4e8f2]'>{selected.description}</p>
          </div>
          <button
            type='button'
            onClick={onClose}
            aria-label='Fechar'
            className='grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#648ca0] bg-[#28546b] text-lg font-bold text-white'
          >
            ✕
          </button>
        </header>
        <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7'>
          <h3 className='mb-3 text-base font-black text-white'>Adicionais</h3>
          {extrasBusy ? (
            <p className='text-sm text-[#e1eef5]'>Carregando adicionais...</p>
          ) : extras.filter((extra) => extra.available).length === 0 ? (
            <p className='rounded-xl bg-[#20475d] p-4 text-sm font-semibold text-white'>Sem adicionais para este produto.</p>
          ) : (
            extras
              .filter((extra) => extra.available)
              .map((extra) => (
                <div key={extra.id} className='flex items-center justify-between gap-3 border-b border-[#48758b] py-3'>
                  <div className='min-w-0'>
                    <strong className='break-words text-sm text-white sm:text-base'>{extra.name}</strong>
                    <p className='mt-1 text-sm font-semibold text-[#c8e7f4]'>+ {brl(extra.price)}</p>
                  </div>
                  <div className='flex shrink-0 items-center gap-2'>
                    <button
                      type='button'
                      aria-label={'Remover ' + extra.name}
                      onClick={() =>
                        setAmounts((previous) => ({ ...previous, [extra.id]: Math.max(0, (previous[extra.id] || 0) - 1) }))
                      }
                      className='grid h-11 w-11 place-items-center rounded-xl bg-[#ffdc86] text-xl font-black text-[#102b40]'
                    >
                      −
                    </button>
                    <span className='min-w-6 text-center font-black text-white'>{amounts[extra.id] || 0}</span>
                    <button
                      type='button'
                      aria-label={'Adicionar ' + extra.name}
                      onClick={() => setAmounts((previous) => ({ ...previous, [extra.id]: (previous[extra.id] || 0) + 1 }))}
                      className='grid h-11 w-11 place-items-center rounded-xl bg-[#ffdc86] text-xl font-black text-[#102b40]'
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
          )}
          <div className='mt-5 flex items-center justify-between gap-3'>
            <span className='font-black text-white'>Quantidade</span>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                aria-label='Diminuir quantidade'
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                className='grid h-11 w-11 place-items-center rounded-xl bg-[#ffdc86] text-xl font-black text-[#102b40]'
              >
                −
              </button>
              <strong className='min-w-7 text-center text-white'>{quantity}</strong>
              <button
                type='button'
                aria-label='Aumentar quantidade'
                onClick={() => setQuantity((value) => value + 1)}
                className='grid h-11 w-11 place-items-center rounded-xl bg-[#ffdc86] text-xl font-black text-[#102b40]'
              >
                +
              </button>
            </div>
          </div>
        </div>
        <footer className='shrink-0 border-t border-[#41687c] bg-[#102c40] px-5 py-4 sm:px-7'>
          <button
            type='button'
            disabled={extrasBusy}
            onClick={addItem}
            className='min-h-12 w-full rounded-xl bg-[#ffca28] px-4 py-3 text-base font-black text-[#0c2a3c] disabled:opacity-60'
          >
            Adicionar •{' '}
            {brl(
              quantity *
                (Number(selected.price) +
                  extras.reduce((total, extra) => total + Number(extra.price) * (amounts[extra.id] || 0), 0)),
            )}
          </button>
        </footer>
      </section>
    </div>
  );
}
