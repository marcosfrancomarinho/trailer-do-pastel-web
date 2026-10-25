import { Navigate, Route, Routes } from 'react-router';
import PublicLayout from './layouts/PublicLayout';
import PrivateLayout from './layouts/PrivateLayout';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import AdminPage from './pages/AdminPage';
import TablesPage from './pages/TablesPage';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path='/' element={<MenuPage />} />
        <Route path='/carrinho' element={<CartPage />} />
        <Route path='/pedidos' element={<OrdersPage />} />
      </Route>
      <Route element={<PrivateLayout />}>
        <Route path='/admin' element={<AdminPage />} />
        <Route path='/mesas' element={<TablesPage />} />
        <Route path='/comandas' element={<Navigate to='/admin' state={{ section: 'comandas' }} replace />} />
      </Route>
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}
