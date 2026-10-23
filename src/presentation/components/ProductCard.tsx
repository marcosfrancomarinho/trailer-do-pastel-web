import type { Product } from '../../domain/models'
import { brl } from '../../api'
type Props = { product: Product; category: string; select: (product: Product) => void }
export default function ProductCard({product: p, category, select}: Props) {
  const drink = /suco|refrigerante|bebida/i.test(category)
  const juice = /suco/i.test(category)
  return <article className={'menu-product-card wooden-product-card ' + (!p.available ? 'product-unavailable ' : '') + (drink ? 'drink-product-card' : 'pastel-product-card')}>
    <div className="wooden-card-top"><span className="wood-nail" aria-hidden="true">●</span><span className="wooden-category">{category}</span><span className="wood-nail" aria-hidden="true">●</span></div>
    <div className="product-art-area"><span className="product-art-flower" aria-hidden="true">✿</span>{p.imageUrl?<img src={p.imageUrl} alt={p.name} className="product-photo" loading="lazy"/>:<span className="product-art-icon" role="img" aria-label={juice?'Suco':drink?'Refrigerante':'Pastéis'}>{juice?'🧃':drink?'🥤':'🥟'}</span>}<span className={'product-availability '+(!p.available?'is-unavailable':'')}>{p.available?'DISPONÍVEL':'INDISPONÍVEL'}</span></div>
    <div className="product-card-body"><h3>{p.name}</h3><p className="product-card-description">{p.description}</p><div className="product-card-bottom"><div className="product-price"><small>A PARTIR DE</small><strong>{brl(p.price)}</strong></div><button type="button" disabled={!p.available} onClick={()=>select(p)} className="product-add-action" aria-label={'Adicionar '+p.name}><span aria-hidden="true">+</span><span>Adicionar</span></button></div></div>
  </article>
}
