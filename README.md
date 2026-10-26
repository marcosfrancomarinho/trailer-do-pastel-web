# Trailer do Pastel — Web

Frontend em React 19, TypeScript, Vite 8 e Tailwind CSS 4.

## Rodar localmente

```bash
yarn install
cp .env.example .env
yarn dev
```

Em `.env`, configure `VITE_API_URL` com a URL do backend, sem barra final. Se não for definida, o frontend usa `https://trailer-do-pastel.onrender.com`.

## Funcionalidades

- Cardápio com categorias, busca e disponibilidade: `GET /categories` e `GET /products`.
- Personalização por produto: `GET /products/:productId/additions`.
- Carrinho persistido no navegador e envio de pedidos: `POST /orders`.
- Histórico local de pedidos e acompanhamento de status: `GET /orders/tracking/:token`.
- Login, gestão de pedidos, mesas, comandas, loja, catálogo e usuários.

O frontend não simula confirmação de pagamento. As operações administrativas dependem da autorização do backend.

## Comandos

```bash
yarn dev
yarn build
yarn lint
yarn test
```

O backend precisa permitir CORS para o endereço do frontend.

## Organização

`src/main.tsx` inicia a aplicação em `src/presentation/App.tsx`, que apenas declara as rotas. A interface segue **layout → páginas → componentes**:

- `src/presentation/layouts/PublicLayout.tsx`: navegação pública e carrinho compartilhado entre cardápio (`/`), carrinho (`/carrinho`) e pedidos do cliente (`/pedidos`).
- `src/presentation/layouts/PrivateLayout.tsx`: sessão e alertas compartilhados entre painel (`/admin`) e mesas (`/mesas`). O histórico de comandas é uma seção do painel. Sem sessão, `/admin` mostra o login e `/mesas` redireciona para ele.
- `src/presentation/pages`: conteúdo das rotas do cardápio, carrinho, pedidos, mesas e painel.
- `src/presentation/hooks/public` e `src/presentation/hooks/admin`: estado, efeitos e ações das páginas de cada área.
- `src/presentation/hooks/global`: hooks de acesso aos contextos compartilhados e aos serviços globais.
- `src/presentation/components/public`, `admin` e `shared`: componentes de cada área e componentes compartilhados.

As páginas chamam seus hooks e montam a interface com componentes. Filtros, checkout, login e acompanhamento de pedidos ficam nos hooks correspondentes.

Os tipos de entrada e saída ficam em `src/application/dtos`; a montagem do pedido, em `src/application/mappers`; e o filtro de data e cálculo do total do carrinho, em `src/application/utils`. O acesso à API, ao armazenamento local, ao áudio e à impressão fica em `src/infrastructure`.

## Tema

Interface submarina inspirada no universo da Fenda do Biquíni, com paleta oceânica, bolhas e elementos tropicais. Layout mobile-first com filtros roláveis e formulários responsivos.
