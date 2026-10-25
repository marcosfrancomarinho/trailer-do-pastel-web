import AdminTables from '../components/admin/AdminTables';
import PrivateAlerts from '../components/admin/PrivateAlerts';
import { useTablesPage } from '../hooks/admin/useTablesPage';

export default function TablesPage() {
  const {
    products,
    categories,
    catalogError,
    loadCatalog,
    onSeeOrders,
  } = useTablesPage();

  return (
    <main className='inner-page mx-auto max-w-6xl space-y-4 px-4 py-5 sm:space-y-6 sm:py-8'>
      <h1 className='sr-only'>Mesas e comandas</h1>
      {catalogError && (
        <p role='alert' className='rounded-xl bg-red-50 p-4 text-red-700'>
          {catalogError}{' '}
          <button type='button' onClick={() => void loadCatalog()} className='underline'>
            Tentar novamente
          </button>
        </p>
      )}
      <PrivateAlerts
        onSeeOrders={onSeeOrders}
      />
      <AdminTables products={products} categories={categories} />
    </main>
  );
}
