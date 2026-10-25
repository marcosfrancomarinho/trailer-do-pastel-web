import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import type { CartItem } from '../../application/dtos/cart';
import { useApplicationServices } from '../hooks/global/useApplicationServices';
import SiteHeader from '../components/public/SiteHeader';
import SiteFooter from '../components/public/SiteFooter';
import { PublicContextProvider } from '../hooks/global/usePublicContext';
import { useStoreStatus } from '../hooks/public/useStoreStatus';

export default function PublicLayout() {
  const useCases = useApplicationServices();
  const [cart, setCart] = useState<CartItem[]>(() => useCases.cart.get.execute());
  const storeState = useStoreStatus();

  useEffect(() => {
    useCases.cart.save.execute(cart);
  }, [cart]);

  return (
    <PublicContextProvider.Provider value={{ cart, setCart, storeState }}>
      <div className='restaurant-app min-h-screen overflow-x-clip'>
        <SiteHeader />
        <Outlet />
        <SiteFooter />
      </div>
    </PublicContextProvider.Provider>
  );
}
