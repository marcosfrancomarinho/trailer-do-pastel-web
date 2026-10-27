import CustomerOrderList from '../components/public/CustomerOrderList';
import { useCustomerOrdersPage } from '../hooks/public/useCustomerOrdersPage';

export default function CustomerOrdersPage() {
  const { orders, statuses, removeSavedOrder, notificationPermission, enableNotifications, pushError } = useCustomerOrdersPage();

  return <CustomerOrderList orders={orders} statuses={statuses} onRemove={removeSavedOrder} notificationPermission={notificationPermission} onEnableNotifications={enableNotifications} pushError={pushError} />;
}
