# Visitados — Municípios Visitados

Aplicação web multi-tenant para marcar municípios brasileiros já visitados em um mapa interativo, com estatísticas de cobertura por Brasil, região ou estado.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Auth.js (NextAuth v5) — e-mail/senha e Google opcional
- Prisma + PostgreSQL (Neon)
- TanStack Query, React Hook Form, Zod
- Mapa com `d3-geo` + malhas do IBGE (proxy via API Routes)

## Configuração local

1. Copie as variáveis de ambiente:

```bash
cp .env.example .env.local
```

2. Preencha `DATABASE_URL` (connection string do Neon) e `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

3. Instale dependências e prepare o banco:

```bash
npm install
npm run db:push
npm run db:seed
```

O seed baixa a lista oficial de municípios da API do IBGE (~5.570 registros).

4. Rode o app:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Funcionalidades

- Cadastro e login (dados isolados por usuário)
- Escopo: Brasil · Região · Estado (drill-down no mapa)
- Clique para marcar município e anexar uma foto da visita (JPEG/PNG/WebP, até 5 MB)
- Busca com autocomplete
- Estatísticas dinâmicas (total, visitados, %, donut + barra)

## Deploy (Vercel + Neon)

1. Crie um projeto no Neon e copie a connection string.
2. Importe o repositório na Vercel.
3. Configure as variáveis: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`.
4. Opcional: `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.
5. Após o primeiro deploy, rode o seed localmente (ou via `npx tsx prisma/seed.ts`) apontando para o banco de produção.

## Paleta do mapa

Cores escolhidas para contraste razoável (incluindo daltonismo): municípios não visitados em verde-acinzentado, visitados em verde saturado (`#0f7a4c`), destaque de busca em âmbar.
