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

2. Preencha `DATABASE_URL` (Neon) e `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

3. Instale dependências e prepare o banco:

```bash
npm install
npm run db:deploy
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
- Clique para marcar município e anexar uma foto da visita (JPEG/PNG/WebP, até 4 MB; armazenada no Neon)
- Busca com autocomplete
- Estatísticas dinâmicas (total, visitados, %, donut + barra)

## Deploy (Vercel + Neon)

1. Crie um projeto no [Neon](https://neon.tech) e copie a connection string (**pooled** + `sslmode=require`).
2. No GitHub: [GeymersonCamara/municipios-do-brasil](https://github.com/GeymersonCamara/municipios-do-brasil).
3. Importe o repositório na Vercel.
4. Configure as variáveis de ambiente em **Settings → Environment Variables**
   (Production e Preview):
   - `DATABASE_URL` = connection string **pooled** do Neon (`sslmode=require`)
   - `AUTH_SECRET` = gerado com `openssl rand -base64 32`
   - `AUTH_URL` = `https://seu-dominio.vercel.app`
5. Faça **Redeploy** (o build falha de propósito se `DATABASE_URL` estiver vazia).
6. Depois do primeiro deploy, rode o seed apontando para o Neon:

```bash
DATABASE_URL="postgresql://..." npm run db:seed
```

## Paleta do mapa

Cores escolhidas para contraste razoável (incluindo daltonismo): municípios não visitados em verde-acinzentado, visitados em verde saturado (`#0f7a4c`), destaque de busca em âmbar.
