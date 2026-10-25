import ProductCard from '../components/public/ProductCard';
import ProductCustomizer from '../components/public/ProductCustomizer';
import CartToast from '../components/public/CartToast';
import { useMenuPage } from '../hooks/public/useMenuPage';

export default function MenuPage() {
  const {
    products,
    categories,
    filter,
    setFilter,
    search,
    setSearch,
    loading,
    error,
    storeState,
    selected,
    setSelected,
    extras,
    extrasBusy,
    amounts,
    setAmounts,
    quantity,
    setQuantity,
    cartToast,
    visible,
    loadCatalog,
    choose,
    addItem,
  } = useMenuPage();

  return (
    <>
      <section className='restaurant-hero'>
        <span className='sea-flower sea-flower-left' aria-hidden='true'>
          ✿
        </span>
        <span className='sea-flower sea-flower-right' aria-hidden='true'>
          ✿
        </span>
        <div className='hero-inner mx-auto grid max-w-6xl items-center gap-8 px-5 py-10 md:grid-cols-[1fr_0.95fr] md:py-20'>
          <div className='relative z-10'>
            <span className='hero-eyebrow'>⚓ BEM-VINDO AO TRAILER DO PASTEL</span>
            <h1 className='hero-headline'>
              UM MAR DE <span>SABORES!</span>
            </h1>
            <p className='hero-description'>
              Pastéis crocantes, recheios caprichados e muita diversão. Escolha seus favoritos e faça seu pedido!
            </p>
            <div className='mt-7 flex flex-wrap items-center gap-3'>
              <button
                onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
                className='restaurant-primary'
              >
                VER CARDÁPIO <span aria-hidden='true'>↗</span>
              </button>
              <span className='hero-kicker'>
                ★ Recheios caprichados
                <br />★ Variedade de sabores
              </span>
            </div>
          </div>
          <div className='hero-illustration spongebob-stage' aria-label='Bob Esponja em destaque no cardápio'>
            <div className='spongebob-backdrop' aria-hidden='true'>
              <span>✿</span>
              <span>✿</span>
              <span>○</span>
            </div>
            <img
              className='spongebob-character'
              src='https://commons.wikimedia.org/wiki/Special:FilePath/SpongeBob_SquarePants_character.png'
              alt='Bob Esponja sorrindo'
            />
            <div className='hero-sticker'>
              PASTÉIS
              <br />
              <strong>DO FUNDO DO MAR!</strong>
            </div>
          </div>
        </div>
      </section>
      <main id='menu' className='menu-section mx-auto max-w-7xl px-4 py-10 md:py-16'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            <p className='text-xs font-black tracking-widest text-[#008b9e]'>NOSSO CARDÁPIO</p>
            <h2 className='mt-2 text-4xl font-black'>
              Nosso <span className='italic text-[#008b9e]'>cardápio</span>
            </h2>
            <p className='mt-2 text-[#557383]'>Escolha seu favorito e adicione aquele recheio extra.</p>
          </div>
          <span className='rounded-full bg-[#ffe39a] px-4 py-2 text-sm font-semibold text-[#16435b]'>
            {products.length} produtos
          </span>
        </div>
        <div className='my-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='category-filters flex max-w-full gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible'>
            <button
              onClick={() => setFilter('all')}
              className={
                'shrink-0 whitespace-nowrap rounded-full px-5 py-2 text-sm font-bold ' +
                (filter === 'all' ? 'bg-[#ffc629] text-[#113548]' : 'bg-white text-[#416476]')
              }
            >
              Todos
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                className={
                  'rounded-full px-5 py-2 text-sm font-bold ' +
                  (filter === c.id ? 'bg-[#ffc629] text-[#113548]' : 'bg-white text-[#416476]')
                }
              >
                {c.name}
              </button>
            ))}
          </div>
          <input
            aria-label='Buscar produto'
            placeholder='Buscar produto...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full rounded-full border border-cyan-100 bg-white px-5 py-3 outline-cyan-400 sm:w-64'
          />
        </div>
        {storeState?.status === 'CLOSED' && (
          <div role='status' className='mb-5 rounded-2xl border-2 border-amber-400 bg-[#4d3921] p-5 text-white'>
            <strong className='text-lg text-amber-200'>🔴 Loja fechada</strong>
            <p className='mt-1 text-sm font-semibold'>
              No momento, não estamos recebendo novos pedidos. Você pode consultar o cardápio e acompanhar pedidos anteriores.
            </p>
          </div>
        )}
        {error && (
          <div role='alert' className='mb-5 rounded-2xl bg-red-50 p-4 text-red-700'>
            {error}{' '}
            <button onClick={() => void loadCatalog()} className='underline'>
              Tentar novamente
            </button>
          </div>
        )}
        {loading ? (
          <div className='py-20 text-center'>Carregando o cardápio...</div>
        ) : visible.length === 0 ? (
          <div className='py-20 text-center'>Nenhum produto encontrado.</div>
        ) : (
          <div className='product-grid grid gap-5 sm:grid-cols-2 lg:grid-cols-4'>
            {visible.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                category={categories.find((c) => c.id === p.categoryId)?.name || 'Especial'}
                select={choose}
              />
            ))}
          </div>
        )}
      </main>
      <ProductCustomizer
        selected={selected}
        extras={extras}
        extrasBusy={extrasBusy}
        amounts={amounts}
        setAmounts={setAmounts}
        quantity={quantity}
        setQuantity={setQuantity}
        addItem={addItem}
        onClose={() => setSelected(null)}
      />
      {cartToast && <CartToast key={cartToast.id} message={cartToast.message} />}
    </>
  );
}
