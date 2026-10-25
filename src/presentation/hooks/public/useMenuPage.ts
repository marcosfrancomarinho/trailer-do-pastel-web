import { useEffect, useMemo, useState } from 'react';
import { useApplicationServices } from '../global/useApplicationServices';
import type { Addition, Category, Product } from '../../../application/dtos/catalog';
import { usePublicContext } from '../global/usePublicContext';

export function useMenuPage() {
  const useCases = useApplicationServices();
  const { setCart, storeState } = usePublicContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [extras, setExtras] = useState<Addition[]>([]);
  const [extrasBusy, setExtrasBusy] = useState(false);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);
  const [cartToast, setCartToast] = useState<{ message: string; id: number } | null>(null);

  async function loadCatalog() {
    setLoading(true);
    setError('');
    try {
      const { categories: cats, products: prods } = await useCases.catalog.listCatalog.execute();
      setCategories(cats);
      setProducts(prods);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar o cardápio');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCatalog();
  }, []);

  useEffect(() => {
    if (!cartToast) return;
    const timeout = window.setTimeout(() => setCartToast(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [cartToast]);

  const visible = useMemo(() => {
    const searchTerm = search.toLowerCase();
    return products.filter(
      (product) =>
        (filter === 'all' || product.categoryId === filter) &&
        `${product.name} ${product.description}`.toLowerCase().includes(searchTerm),
    );
  }, [products, filter, search]);

  async function choose(product: Product) {
    if (!product.available) return;
    setSelected(product);
    setExtras([]);
    setAmounts({});
    setQuantity(1);
    setExtrasBusy(true);
    try {
      setExtras(await useCases.catalog.listProductAdditions.execute(product.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar adicionais');
      setSelected(null);
    } finally {
      setExtrasBusy(false);
    }
  }

  function addItem() {
    if (!selected || extrasBusy) return;
    setCart((cart) => useCases.cart.addItem.execute({ cart, product: selected, additions: extras, amounts, quantity }));
    setCartToast((previous) => ({
      message: quantity + '× ' + selected.name + ' adicionado ao carrinho!',
      id: (previous?.id ?? 0) + 1,
    }));
    setSelected(null);
  }

  return {
    products,
    categories,
    filter,
    setFilter,
    search,
    setSearch,
    loading,
    error,
    storeState,
    selected,
    setSelected,
    extras,
    extrasBusy,
    amounts,
    setAmounts,
    quantity,
    setQuantity,
    cartToast,
    visible,
    loadCatalog,
    choose,
    addItem,
  };
}
