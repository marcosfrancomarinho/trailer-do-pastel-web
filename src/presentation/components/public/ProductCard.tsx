import { brl } from '../../../shared/formatters/currency';
import type { Product } from '../../../application/dtos/catalog';

type Props = {
  product: Product;
  category: string;
  select: (product: Product) => void;
};

export default function ProductCard({ product, category, select }: Props) {
  const isDrink = /suco|refrigerante|bebida/i.test(category);
  const isJuice = /suco/i.test(category);
  const fallbackIcon = isJuice ? '🧃' : isDrink ? '🥤' : '🥟';
  const fallbackLabel = isJuice ? 'Suco' : isDrink ? 'Refrigerante' : 'Pastéis';
  const cardClassName = [
    'menu-product-card wooden-product-card',
    product.available ? '' : 'product-unavailable',
    isDrink ? 'drink-product-card' : 'pastel-product-card',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={cardClassName}>
      <div className='wooden-card-top'>
        <span className='wood-nail' aria-hidden='true'>
          ●
        </span>
        <span className='wooden-category'>{category}</span>
        <span className='wood-nail' aria-hidden='true'>
          ●
        </span>
      </div>

      <div className='product-art-area'>
        <span className='product-art-flower' aria-hidden='true'>
          ✿
        </span>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className='product-photo' loading='lazy' />
        ) : (
          <span className='product-art-icon' role='img' aria-label={fallbackLabel}>
            {fallbackIcon}
          </span>
        )}
        <span className={'product-availability ' + (product.available ? '' : 'is-unavailable')}>
          {product.available ? 'DISPONÍVEL' : 'INDISPONÍVEL'}
        </span>
      </div>

      <div className='product-card-body'>
        <h3>{product.name}</h3>
        <p className='product-card-description'>{product.description}</p>
        <div className='product-card-bottom'>
          <div className='product-price'>
            <small>A PARTIR DE</small>
            <strong>{brl(product.price)}</strong>
          </div>
          <button
            type='button'
            disabled={!product.available}
            onClick={() => select(product)}
            className='product-add-action'
            aria-label={'Adicionar ' + product.name}
          >
            <span aria-hidden='true'>+</span>
            <span>Adicionar</span>
          </button>
        </div>
      </div>
    </article>
  );
}
