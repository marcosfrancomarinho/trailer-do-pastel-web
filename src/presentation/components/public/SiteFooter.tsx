import { useNavigate } from 'react-router';
import AnchorLogo from '../shared/AnchorLogo';

export default function SiteFooter() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  function go(path: string) {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <footer className='restaurant-footer mt-16 px-4 py-8 text-left sm:px-6 sm:py-10'>
      <div className='mx-auto max-w-6xl'>
        <div className='grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center'>
          <div>
            <div className='flex items-center gap-3'>
              <span aria-hidden='true' className='grid h-11 w-11 place-items-center rounded-xl border border-amber-300/70 bg-amber-300/10 text-2xl text-amber-200'>
                <AnchorLogo className='h-10 w-10' idPrefix='footer-anchor' />
              </span>
              <div>
                <strong className='block text-lg font-black text-white'>Trailer do Pastel</strong>
                <span className='text-xs font-bold uppercase tracking-wide text-amber-200'>Um mar de sabores</span>
              </div>
            </div>
            <p className='mt-3 max-w-sm text-sm leading-relaxed text-slate-300'>Acompanhe as novidades e fale com a nossa equipe.</p>
          </div>

          <div className='grid gap-3 sm:grid-cols-2'>
            <a
              href='https://www.instagram.com/trailerdopastelitz/'
              target='_blank'
              rel='noopener noreferrer'
              aria-label='Abrir Instagram do Trailer do Pastel em nova aba'
              className='flex min-h-16 items-center gap-3 rounded-xl border border-pink-400/60 bg-pink-500/10 px-4 py-3 text-white transition-colors hover:border-pink-300 hover:bg-pink-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-300'
            >
              <svg aria-hidden='true' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='h-6 w-6 shrink-0 text-pink-300'>
                <rect x='3' y='3' width='18' height='18' rx='5' />
                <circle cx='12' cy='12' r='4' />
                <circle cx='17.5' cy='6.5' r='1' fill='currentColor' stroke='none' />
              </svg>
              <span className='min-w-0'>
                <strong className='block text-sm font-black'>Instagram</strong>
                <span className='block truncate text-xs text-slate-200'>@trailerdopastelitz</span>
              </span>
            </a>
            <a
              href='https://wa.me/5599984636486'
              target='_blank'
              rel='noopener noreferrer'
              aria-label='Abrir WhatsApp do Trailer do Pastel no número 99 98463-6486 em nova aba'
              className='flex min-h-16 items-center gap-3 rounded-xl border border-emerald-400/60 bg-emerald-500/10 px-4 py-3 text-white transition-colors hover:border-emerald-300 hover:bg-emerald-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300'
            >
              <svg aria-hidden='true' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='h-6 w-6 shrink-0 text-emerald-300'>
                <path d='M21 16.5v2.7a2 2 0 0 1-2.2 2A18 18 0 0 1 2.8 5.2 2 2 0 0 1 4.8 3h2.7a2 2 0 0 1 2 1.7l.4 2.8a2 2 0 0 1-.6 1.7l-1.7 1.7a14 14 0 0 0 5.5 5.5l1.7-1.7a2 2 0 0 1 1.7-.6l2.8.4a2 2 0 0 1 1.7 2Z' />
              </svg>
              <span className='min-w-0'>
                <strong className='block text-sm font-black'>WhatsApp</strong>
                <span className='block text-xs text-slate-200'>(99) 98463-6486</span>
              </span>
            </a>
          </div>
        </div>

        <div className='mt-8 flex flex-col gap-4 border-t border-[#31546a] pt-5 text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between'>
          <span>© {year} Trailer do Pastel</span>
          <nav className='flex flex-wrap items-center gap-x-5 gap-y-2' aria-label='Links do rodapé'>
            <button type='button' onClick={() => go('/')} className='min-h-10 font-bold hover:underline'>Cardápio</button>
            <button type='button' onClick={() => go('/pedidos')} className='min-h-10 font-bold hover:underline'>Meus pedidos</button>
            <button type='button' onClick={() => go('/admin')} className='min-h-10 font-bold hover:underline'>Área administrativa</button>
          </nav>
        </div>
      </div>
    </footer>
  );
}
