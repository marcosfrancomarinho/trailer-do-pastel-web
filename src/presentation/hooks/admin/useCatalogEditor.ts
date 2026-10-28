import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useApplicationServices } from '../global/useApplicationServices';
import type { Addition, Category, Product } from '../../../application/dtos/catalog';
import { useActionDialog } from '../../components/shared/ActionDialog';

export type ManageKind = 'product' | 'addition' | 'category';
type Item = Product | Addition | Category;
const headings: Record<ManageKind, string> = {
  product: 'Produtos',
  addition: 'Adicionais',
  category: 'Categorias',
};

export function useCatalogEditor(kind: ManageKind) {
  const useCases = useApplicationServices();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [additions, setAdditions] = useState<Addition[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [available, setAvailable] = useState(true);
  const [additionIds, setAdditionIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { confirm, notify, dialog } = useActionDialog();

  function listManagedItems() {
    if (kind === 'product') return useCases.catalog.listProducts.execute();
    if (kind === 'addition') return useCases.catalog.listAdditions.execute();
    return useCases.catalog.listCategories.execute();
  }

  async function reload() {
    try {
      const [records, loadedCategories, loadedAdditions] = await Promise.all([
        listManagedItems(),
        useCases.catalog.listCategories.execute(),
        useCases.catalog.listAdditions.execute(),
      ]);
      setItems(records);
      setCategories(loadedCategories);
      setAdditions(loadedAdditions);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar cadastros.');
    }
  }

  useEffect(() => {
    void reload();
  }, [kind]);

  useEffect(() => {
    if (!editing) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) setEditing(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editing, busy]);

  async function startEdit(item: Item) {
    setEditing(item.id);
    setError('');
    setMessage('');
    setName(item.name);
    if ('sortOrder' in item) setSortOrder(item.sortOrder);
    setAdditionIds([]);
    if ('price' in item) {
      setPrice(item.price);
      setAvailable(item.available);
    }
    if ('description' in item) {
      setDescription(item.description);
      setCategoryId(item.categoryId);
      setImageUrl(item.imageUrl ?? '');
      try {
        const extras = await useCases.catalog.listProductAdditions.execute(item.id);
        setAdditionIds(extras.map((extra) => extra.id));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Falha ao carregar adicionais.');
      }
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || busy) return;

    setBusy(true);
    setError('');
    try {
      if (kind === 'category') {
        await useCases.catalog.updateCategory.execute({ id: editing, data: { name, sortOrder } });
      } else if (kind === 'addition') {
        await useCases.catalog.updateAddition.execute({ id: editing, data: { name, price, available } });
      } else {
        await useCases.catalog.updateProduct.execute({
          id: editing,
          data: { name, description, price, categoryId, imageUrl: imageUrl.trim() || null, additionIds, available },
        });
      }
      setEditing(null);
      setMessage('Cadastro atualizado com sucesso.');
      notify({ title: 'Alteração salva', message: 'As informações foram atualizadas com sucesso.', tone: 'success' });
      await reload();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível salvar.';
      setError(message);
      notify({ title: 'Erro ao salvar', message, tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: Item) {
    const approved = await confirm({
      title: 'Excluir cadastro?',
      message: 'Deseja excluir "' + item.name + '"? Essa ação não pode ser desfeita.',
      confirmLabel: 'Sim, excluir',
    });
    if (!approved) return;
    setBusy(true);
    setError('');
    try {
      if (kind === 'product') await useCases.catalog.removeProduct.execute({ id: item.id });
      else if (kind === 'addition') await useCases.catalog.removeAddition.execute({ id: item.id });
      else await useCases.catalog.removeCategory.execute({ id: item.id });
      setMessage('Cadastro excluído.');
      notify({ title: 'Cadastro excluído', message: 'O cadastro foi excluído com sucesso.', tone: 'success' });
      await reload();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível excluir. O cadastro pode estar em uso.';
      setError(message);
      notify({ title: 'Erro ao excluir', message, tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  const heading = headings[kind];

  return {
    items,
    categories,
    additions,
    editing,
    setEditing,
    name,
    setName,
    sortOrder,
    setSortOrder,
    description,
    setDescription,
    price,
    setPrice,
    categoryId,
    setCategoryId,
    imageUrl,
    setImageUrl,
    available,
    setAvailable,
    additionIds,
    setAdditionIds,
    busy,
    error,
    message,
    dialog,
    heading,
    startEdit,
    save,
    remove,
  };
}
