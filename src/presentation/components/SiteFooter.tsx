type Props = { navigate: (page: 'menu'|'tracking'|'admin') => void }
export default function SiteFooter({navigate}: Props) {
  return <footer className="restaurant-footer mt-16 px-4 py-8 text-center text-xs">⚓ TRAILER DO PASTEL · UM MAR DE SABOR · <button className="underline" onClick={()=>navigate('admin')}>Área administrativa</button><div className="mt-4 flex justify-center gap-5 sm:hidden"><button onClick={()=>navigate('menu')}>Cardápio</button><button onClick={()=>navigate('tracking')}>Meus pedidos</button></div></footer>
}
