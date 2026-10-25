import CustomerOrders from '../components/public/CustomerOrders';
import { useOrdersPage } from '../hooks/public/useOrdersPage';

export default function OrdersPage() {
  const { orders, statuses, removeSavedOrder } = useOrdersPage();

  return <CustomerOrders orders={orders} statuses={statuses} onRemove={removeSavedOrder} />;
}
