import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useApplicationServices } from '../global/useApplicationServices';
import type { Addition, Category } from '../../../application/dtos/catalog';
import { useActionDialog } from '../../components/shared/ActionDialog';

export type RegisterSection = 'product' | 'addition' | 'user' | 'category';

const successMessages: Record<RegisterSection, string> = {
  product: 'Produto cadastrado com sucesso!',
  addition: 'Adicional cadastrado com sucesso!',
  user: 'Usuário cadastrado com sucesso!',
  category: 'Categoria cadastrada com sucesso!',
};

export function useAdminRegisters(section: RegisterSection) {
  const useCases = useApplicationServices();
  const [categories, setCategories] = useState<Category[]>([]);
  const [additions, setAdditions] = useState<Addition[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [additionIds, setAdditionIds] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [available, setAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const { notify, dialog } = useActionDialog();

  async function loadOptions() {
    try {
      const [cats, adds] = await Promise.all([
        useCases.catalog.listCategories.execute(),
        useCases.catalog.listAdditions.execute(),
      ]);
      setCategories(cats);
      setAdditions(adds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar categorias e adicionais.');
    }
  }
  useEffect(() => {
    void loadOptions();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (section === 'product') {
        await useCases.catalog.createProduct.execute({
          data: {
            name: name.trim(),
            description: description.trim(),
            price,
            categoryId,
            imageUrl: imageUrl.trim() || null,
            additionIds,
            available,
          },
        });
      } else if (section === 'addition') {
        await useCases.catalog.createAddition.execute({ data: { name: name.trim(), price, available } });
      } else if (section === 'category') {
        await useCases.catalog.createCategory.execute({ data: { name: name.trim() } });
      } else {
        await useCases.users.create.execute({ name, password });
      }
      setSuccess(successMessages[section]);
      notify({ title: 'Cadastro realizado', message: 'As informações foram cadastradas com sucesso.', tone: 'success' });
      setName('');
      setPassword('');
      setPrice('');
      setDescription('');
      setImageUrl('');
      setAdditionIds([]);
      setAvailable(true);
      if (section === 'addition' || section === 'category') await loadOptions();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao realizar cadastro.';
      setError(message);
      notify({ title: 'Cadastro não realizado', message, tone: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return {
    categories,
    additions,
    name,
    setName,
    description,
    setDescription,
    price,
    setPrice,
    categoryId,
    setCategoryId,
    imageUrl,
    setImageUrl,
    additionIds,
    setAdditionIds,
    password,
    setPassword,
    available,
    setAvailable,
    saving,
    success,
    error,
    dialog,
    handleSubmit,
  };
}
