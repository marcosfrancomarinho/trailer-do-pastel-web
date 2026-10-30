import { useCallback, useEffect, useMemo, useState } from 'react';
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

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const catalog = await useCases.catalog.listCatalog.execute();
      setCategories([...catalog.categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'pt-BR')));
      setProducts(catalog.products);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar o cardápio');
    } finally {
      setLoading(false);
    }
  }, [useCases]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (!cartToast) return;
    const timeout = window.setTimeout(() => setCartToast(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [cartToast]);

  const visible = useMemo(() => {
    const searchTerm = search.toLowerCase();
    const matchingProducts = products.filter((product) => {
      const matchesCategory = filter === 'all' || product.categoryId === filter;
      const nameAndDescription = `${product.name} ${product.description}`.toLowerCase();
      const matchesSearch = nameAndDescription.includes(searchTerm);
      return matchesCategory && matchesSearch;
    });
    const position = new Map(categories.map((category, index) => [category.id, index]));
    return matchingProducts.sort((a, b) =>
      (position.get(a.categoryId) ?? Number.MAX_SAFE_INTEGER) - (position.get(b.categoryId) ?? Number.MAX_SAFE_INTEGER)
      || a.name.localeCompare(b.name, 'pt-BR'),
    );
  }, [products, categories, filter, search]);

  async function choose(product: Product) {
    if (!product.available) return;
    setSelected(product);
    setExtras([]);
    setAmounts({});
    setQuantity(1);
    setExtrasBusy(true);
    try {
      const productAdditions = await useCases.catalog.listProductAdditions.execute(product.id);
      setExtras(productAdditions);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar adicionais');
      setSelected(null);
    } finally {
      setExtrasBusy(false);
    }
  }

  function addItem() {
    if (!selected || extrasBusy) return;
    setCart((currentCart) => {
      const nextCart = useCases.cart.addItem.execute({ cart: currentCart, product: selected, additions: extras, amounts, quantity });
      return nextCart;
    });
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
