import { brl } from '../../../shared/formatters/currency';
import type { CartItem } from '../../../application/dtos/cart';
import { usePublicContext } from '../../hooks/global/usePublicContext';
import { CartTotal } from '../../../application/utils/cart-total';

type Props = { item: CartItem };

export default function CartItemCard({ item }: Props) {
  const { setCart } = usePublicContext();
  return (
    <div className='rounded-2xl bg-white p-5 shadow-sm'>
      <div className='flex justify-between gap-3'>
        <div>
          <h3 className='text-lg font-extrabold'>{item.product.name}</h3>
          {item.additions.map((extra) => (
            <p key={extra.addition.id} className='text-sm text-[#557383]'>
              + {extra.quantity}× {extra.addition.name}
            </p>
          ))}
        </div>
        <strong>{brl(CartTotal.calculate([item]))}</strong>
      </div>
      <div className='mt-4 flex items-center gap-4'>
        <button
          aria-label='Diminuir quantidade'
          className='rounded-lg bg-[#e8faff] px-3 py-1'
          onClick={() =>
            setCart((cart) =>
              cart
                .map((entry) => (entry.key === item.key ? { ...entry, quantity: entry.quantity - 1 } : entry))
                .filter((entry) => entry.quantity > 0),
            )
          }
        >
          −
        </button>
        <b>{item.quantity}</b>
        <button
          aria-label='Aumentar quantidade'
          className='rounded-lg bg-[#e8faff] px-3 py-1'
          onClick={() =>
            setCart((cart) => cart.map((entry) => (entry.key === item.key ? { ...entry, quantity: entry.quantity + 1 } : entry)))
          }
        >
          +
        </button>
        <button
          className='ml-auto text-sm text-red-600'
          onClick={() => setCart((cart) => cart.filter((entry) => entry.key !== item.key))}
        >
          Remover
        </button>
      </div>
    </div>
  );
}
