import { useLocation } from 'react-router';
import CustomerOrderList from '../components/public/CustomerOrderList';
import { useCustomerOrdersPage } from '../hooks/public/useCustomerOrdersPage';

export default function CustomerOrdersPage() {
  const location = useLocation();
  const justOrdered = Boolean((location.state as { justOrdered?: boolean } | null)?.justOrdered);
  const { orders, statuses, removeSavedOrder, notificationPermission, enableNotifications, pushError } = useCustomerOrdersPage();

  return <CustomerOrderList orders={orders} statuses={statuses} onRemove={removeSavedOrder} notificationPermission={notificationPermission} onEnableNotifications={enableNotifications} pushError={pushError} justOrdered={justOrdered} />;
}
