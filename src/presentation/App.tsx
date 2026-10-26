import { Navigate, Route, Routes } from 'react-router';
import PublicLayout from './layouts/PublicLayout';
import PrivateLayout from './layouts/PrivateLayout';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import CustomerOrdersPage from './pages/CustomerOrdersPage';
import PainelAdminPage from './pages/PainelAdminPage';
import TableManagementPage from './pages/TableManagementPage';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path='/' element={<MenuPage />} />
        <Route path='/carrinho' element={<CartPage />} />
        <Route path='/pedidos' element={<CustomerOrdersPage />} />
      </Route>
      <Route element={<PrivateLayout />}>
        <Route path='/painel' element={<PainelAdminPage />} />
        <Route path='/mesas' element={<TableManagementPage />} />
      </Route>
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}
