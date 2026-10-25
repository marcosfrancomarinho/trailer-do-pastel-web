import { useNavigate } from 'react-router';
import AnchorLogo from './AnchorLogo';

export default function BrandMark() {
  const navigate = useNavigate();

  function goToMenu() {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <button
      type='button'
      className='brand-mark flex items-center gap-3 text-left'
      onClick={goToMenu}
      aria-label='Trailer do Pastel - ir ao cardápio'
    >
      <span className='brand-symbol anchor-brand' aria-hidden='true'>
        <AnchorLogo className='anchor-logo' />
      </span>
      <span className='brand-letters'>
        TRAILER DO PASTEL
        <small className='brand-tagline'>PASTÉIS • UM MAR DE SABORES</small>
      </span>
    </button>
  );
}
