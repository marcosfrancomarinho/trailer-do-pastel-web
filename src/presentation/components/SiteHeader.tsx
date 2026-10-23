import AnchorLogo from '../atoms/AnchorLogo'
type Props = { view: string; count: number; navigate: (page: 'menu'|'cart'|'tracking'|'admin') => void }
export default function SiteHeader({view, count, navigate}: Props) {
  return <header className="restaurant-header sticky top-0 z-30"><div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2.5 md:py-3">
    <button className="brand-mark flex items-center gap-3 text-left" onClick={()=>navigate('menu')} aria-label="Trailer do Pastel - ir ao cardápio"><span className="brand-symbol anchor-brand" aria-hidden="true"><AnchorLogo className="anchor-logo" /></span><span className="brand-letters">TRAILER DO PASTEL</span></button>
    <nav className="hidden gap-2 text-sm font-bold sm:flex" aria-label="Navegação principal"><button onClick={()=>navigate('menu')} className={view==='menu'?'nav-active':''}>Cardápio</button><button onClick={()=>navigate('tracking')} className={view==='tracking'?'nav-active':''}>Meus pedidos</button></nav>
    <button onClick={()=>navigate('cart')} className="cart-header-button" aria-label={'Abrir carrinho com '+count+' itens'}>🛒 <span className="hidden sm:inline">Carrinho</span>{count>0&&<b>{count}</b>}</button>
  </div></header>
}
