import CartItemCard from '../components/public/CartItemCard';
import CheckoutForm from '../components/public/CheckoutForm';
import { useCartPage } from '../hooks/public/useCartPage';

export default function CartPage() {
  const {
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
  } = useCartPage();

  return (
    <main className='inner-page mx-auto max-w-5xl px-4 py-12'>
      <button className='mb-6 text-sm font-bold text-[#008b9e]' onClick={() => go('menu')}>
        ← Voltar ao cardápio
      </button>
      <h1 className='mb-8 text-4xl font-black'>Seu carrinho</h1>
      {cart.length === 0 ? (
        <div className='rounded-3xl bg-white p-12 text-center'>
          <p className='mb-5'>Seu carrinho está vazio.</p>
          <button className='rounded-full bg-[#ffc629] px-6 py-3 font-bold text-[#113548]' onClick={() => go('menu')}>
            Escolher pastéis
          </button>
        </div>
      ) : (
        <div className='grid gap-8 md:grid-cols-[1.3fr_1fr]'>
          <div className='space-y-3'>
            {cart.map((item) => (
              <CartItemCard key={item.key} item={item} />
            ))}
          </div>
          <CheckoutForm
            total={total}
            customerName={customerName}
            setCustomerName={setCustomerName}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            observation={observation}
            setObservation={setObservation}
            storeState={storeState}
            error={error}
            sending={sending}
            checkout={checkout}
          />
        </div>
      )}
    </main>
  );
}
