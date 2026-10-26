import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useApplicationServices } from '../global/useApplicationServices';
import { usePrivateContext } from '../global/usePrivateContext';

type AdminSection =
  | 'orders'
  | 'comandas'
  | 'store'
  | 'users-list'
  | 'product'
  | 'addition'
  | 'user'
  | 'category'
  | 'manage-products'
  | 'manage-additions'
  | 'manage-categories';

const adminNavigation = [
  { key: 'comandas', icon: '🧾', label: 'Comandas' },
  { key: 'store', icon: '🏪', label: 'Abrir / fechar loja' },
  { key: 'product', icon: '🥟', label: 'Produtos' },
  { key: 'addition', icon: '🧀', label: 'Adicionais' },
  { key: 'user', icon: '👤', label: 'Cadastrar usuário' },
  { key: 'users-list', icon: '👥', label: 'Gerenciar usuários' },
  { key: 'category', icon: '🗂️', label: 'Nova categoria' },
  { key: 'manage-products', icon: '✏️', label: 'Gerenciar produtos' },
  { key: 'manage-additions', icon: '⚙️', label: 'Gerenciar adicionais' },
  { key: 'manage-categories', icon: '🗃️', label: 'Gerenciar categorias' },
] as const;

const ordersNavigation = { key: 'orders', icon: '📋', label: 'Pedidos' } as const;

export function useDashboardPage() {
  const useCases = useApplicationServices();
  const navigate = useNavigate();
  const { session, setSession, alerts } = usePrivateContext();
  const adminToken = session?.token ?? '';
  const adminRole = session?.role ?? 'EMPLOYEE';
  const adminDisplayName = session?.name ?? '';
  const [adminName, setAdminName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminSection, setAdminSection] = useState<AdminSection>('orders');
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminError, setAdminError] = useState('');
  const isAdmin = adminRole === 'ADMIN';
  const navigationItems = isAdmin ? [ordersNavigation, ...adminNavigation] : [ordersNavigation];
  const profileInitials = adminDisplayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const { notificationsOn, pendingCount, setOrdersVisible, dismissNew } = alerts;

  useEffect(() => {
    setOrdersVisible(adminSection === 'orders');
    return () => setOrdersVisible(false);
  }, [adminSection, setOrdersVisible]);

  useEffect(() => {
    if (!adminMenuOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeMenu();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [adminMenuOpen]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (adminBusy) return;
    setAdminBusy(true);
    setAdminError('');
    try {
      const authenticatedSession = await useCases.auth.signIn.execute({ name: adminName, password: adminPassword });
      setSession(authenticatedSession);
      setAdminPassword('');
      navigate('/mesas');
    } catch (cause) {
      setAdminError(cause instanceof Error ? cause.message : 'Não foi possível entrar');
    } finally {
      setAdminBusy(false);
    }
  }

  function onSeeOrders() {
    setAdminSection('orders');
    setAdminMenuOpen(false);
    dismissNew();
  }

  function selectSection(section: AdminSection) {
    closeMenu();
    setAdminSection(section);
    setAdminError('');
  }

  function toggleMenu() {
    setAdminMenuOpen((open) => !open);
  }

  function closeMenu() {
    setAdminMenuOpen(false);
    menuButtonRef.current?.focus();
  }

  function logout() {
    useCases.auth.signOut.execute();
    setSession(null);
    setAdminMenuOpen(false);
  }

  return {
    adminToken,
    adminRole,
    adminDisplayName,
    adminName,
    setAdminName,
    adminPassword,
    setAdminPassword,
    adminSection,
    adminMenuOpen,
    menuButtonRef,
    adminBusy,
    adminError,
    navigationItems,
    profileInitials,
    notificationsOn,
    pendingCount,
    login,
    onSeeOrders,
    selectSection,
    toggleMenu,
    closeMenu,
    logout,
  };
}
