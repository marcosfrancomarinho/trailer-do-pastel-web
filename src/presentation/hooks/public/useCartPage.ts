import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useApplicationServices } from '../global/useApplicationServices';
import { CartTotal } from '../../../application/utils/cart-total.ts';
import { usePublicContext } from '../global/usePublicContext';

export function useCartPage() {
  const useCases = useApplicationServices();
  const navigate = useNavigate();
  const { cart, setCart, storeState } = usePublicContext();
  const [customerInfo] = useState(() => useCases.customer.getInfo.execute());
  const [customerName, setCustomerName] = useState(customerInfo.name);
  const [customerPhone, setCustomerPhone] = useState(customerInfo.phone);
  const [observation, setObservation] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const total = CartTotal.calculate(cart);

  function go(next: 'menu' | 'tracking') {
    navigate(next === 'menu' ? '/' : '/pedidos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cart.length || sending) return;

    setSending(true);
    setError('');
    try {
      await useCases.orders.create.execute({ customerName, customerPhone, cart, observation });
      setCart([]);
      setObservation('');
      go('tracking');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir o pedido');
    } finally {
      setSending(false);
    }
  }

  return {
    cart,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    observation,
    setObservation,
    storeState,
    sending,
    error,
    total,
    go,
    checkout,
  };
}
