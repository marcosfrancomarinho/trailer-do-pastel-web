import AdminTables from '../components/admin/AdminTables';
import PrivateAlerts from '../components/admin/PrivateAlerts';
import { useNavigate } from 'react-router';
import { usePrivateContext } from '../hooks/global/usePrivateContext';

export default function TablesPage() {
  const navigate = useNavigate();
  const {
    alerts: { dismissNew },
  } = usePrivateContext();

  function onSeeOrders() {
    dismissNew();
    navigate('/admin');
  }

  return (
    <main className='inner-page mx-auto max-w-6xl space-y-4 px-4 py-5 sm:space-y-6 sm:py-8'>
      <h1 className='sr-only'>Mesas e comandas</h1>
      <PrivateAlerts onSeeOrders={onSeeOrders} />
      <AdminTables />
    </main>
  );
}
