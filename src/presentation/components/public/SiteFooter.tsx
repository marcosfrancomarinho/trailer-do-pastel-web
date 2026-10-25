import { useNavigate } from 'react-router';

export default function SiteFooter() {
  const navigate = useNavigate();

  function go(path: string) {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <footer className='restaurant-footer mt-16 px-4 py-8 text-center text-xs'>
      ⚓ TRAILER DO PASTEL · UM MAR DE SABORES ·{' '}
      <button type='button' className='underline' onClick={() => go('/admin')}>
        Área administrativa
      </button>
      <div className='mt-4 flex justify-center gap-5 sm:hidden'>
        <button type='button' onClick={() => go('/')}>
          Cardápio
        </button>
        <button type='button' onClick={() => go('/pedidos')}>
          Meus pedidos
        </button>
      </div>
    </footer>
  );
}
