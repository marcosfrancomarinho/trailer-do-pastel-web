# Trailer do Pastel — Web

Frontend em React 19, TypeScript, Vite 8 e Tailwind CSS 4.

## Rodar localmente

```bash
yarn install
cp .env.example .env
yarn dev
```

Em `.env`, configure `VITE_API_URL` com a URL do backend, sem barra final. Para testar no notebook com o backend na porta 3000, use `http://localhost:3000`.

## Funcionalidades

- Cardápio com categorias, busca e disponibilidade: `GET /categories` e `GET /products`.
- Personalização por produto: `GET /products/:productId/additions`.
- Carrinho e envio real dos pedidos: `POST /orders`.
- Confirmação do pedido e token salvo no navegador (a consulta de status ainda depende de rota futura).
- Login e visualização de pedidos pendentes: `POST /login` e `GET /orders/pending`.

O frontend não simula confirmação de pagamento nem atualização de status. Não contém cadastro público de administradores.

## Comandos

```bash
yarn dev
yarn build
yarn lint
```

O backend precisa permitir CORS para o endereço do frontend. O endereço `trycloudflare.com` é temporário; configure uma URL estável para produção.

## Pendências do backend

- `GET /orders/tracking/:token` para acompanhamento atualizado.
- `PATCH /orders/:id/status` para controlar o preparo.
- Restringir autenticação e autorização nas rotas administrativas.
- Validar se adicionais enviados no pedido estão associados ao produto.

## Organização

Mantida a estrutura padrão do Vite: `src/App.tsx`, `src/main.tsx`, `src/index.css`, `vite.config.ts`. Acesso HTTP e tipos em `src/api.ts`.

## Tema

Interface submarina inspirada no universo da Fenda do Biquíni, com paleta oceânica, bolhas e elementos tropicais. Layout mobile-first com filtros roláveis e formulários responsivos.
