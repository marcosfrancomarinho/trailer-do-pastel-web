import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useApplicationServices } from '../global/useApplicationServices';
import type { Category, Product } from '../../../application/dtos/catalog';
import { usePrivateContext } from '../global/usePrivateContext';

export function useTablesPage() {
  const useCases = useApplicationServices();
  const navigate = useNavigate();
  const { alerts } = usePrivateContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogError, setCatalogError] = useState('');
  const { dismissNew } = alerts;

  async function loadCatalog() {
    setCatalogError('');
    try {
      const { categories: cats, products: prods } = await useCases.catalog.listCatalog.execute();
      setCategories(cats);
      setProducts(prods);
    } catch (cause) {
      setCatalogError(cause instanceof Error ? cause.message : 'Falha ao carregar o cardápio.');
    }
  }
  useEffect(() => {
    void loadCatalog();
  }, []);

  function onSeeOrders() {
    dismissNew();
    navigate('/admin');
  }

  return {
    products,
    categories,
    catalogError,
    loadCatalog,
    onSeeOrders,
  };
}
