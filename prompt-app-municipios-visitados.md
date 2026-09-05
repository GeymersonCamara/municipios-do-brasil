# Prompt para o Cursor — App "Municípios Visitados"

Copie e cole o conteúdo abaixo no chat do Cursor (Composer/Agent) para iniciar o projeto.

---

## Contexto do Projeto

Quero criar uma aplicação web **multi-tenant** chamada **"Municípios Visitados"** (pode sugerir um nome melhor), onde cada usuário cadastrado pode marcar em um mapa interativo do Brasil quais municípios ele já visitou, e acompanhar estatísticas de cobertura geográfica.

## Stack Tecnológica

- **Frontend:** React 18 + TypeScript + Vite
- **Estilização:** TailwindCSS + shadcn/ui (componentes acessíveis e modernos)
- **Mapas:** react-simple-maps (ou deck.gl/mapbox-gl se precisar de mais performance) com TopoJSON do Brasil (IBGE) para estados e municípios
- **Gerenciamento de estado/servidor:** TanStack Query (React Query) para cache e sincronização com a API
- **Formulários/validação:** React Hook Form + Zod
- **Backend:** API Routes do Next.js (App Router) OU um backend separado com Fastify/Express — decida pela abordagem mais simples de manter (recomendo Next.js full-stack para deploy único na Vercel)
- **ORM:** Prisma (ou Drizzle ORM) conectado ao **Neon** (PostgreSQL serverless)
- **Autenticação:** NextAuth.js (Auth.js) com suporte a e-mail/senha e, se possível, login social (Google)
- **Multi-tenancy:** cada usuário é um "tenant" isolado — os dados de municípios visitados são sempre filtrados por `userId`
- **Deploy:** Vercel (frontend + API) + Neon (banco de dados PostgreSQL)
- **Dados geográficos:** usar a API do IBGE (https://servicodados.ibge.gov.br/api/docs) para obter a lista oficial de estados, regiões e municípios do Brasil (nomes, códigos IBGE, e geometria/malhas via https://servicodados.ibge.gov.br/api/docs/malhas)

## Funcionalidades Principais

### 1. Autenticação e Cadastro
- Tela de cadastro (nome, e-mail, senha) e login
- Cada usuário só enxerga e edita seus próprios dados de municípios visitados

### 2. Seleção de Escopo do Mapa
O usuário pode escolher entre três níveis de visualização:
- **Brasil inteiro** (todos os ~5.570 municípios)
- **Por região** (Norte, Nordeste, Centro-Oeste, Sudeste, Sul)
- **Por estado** (ex: Rio Grande do Norte, com seus 167 municípios)

A navegação deve permitir "entrar" em um estado a partir do mapa do Brasil (drill-down), e voltar facilmente.

### 3. Marcação de Municípios Visitados
- Ao clicar em um município no mapa, ele alterna entre "visitado" / "não visitado"
- Município visitado deve ter destaque visual claro (cor de preenchimento diferente, com uma paleta agradável e acessível — considerar contraste para daltonismo)
- Estado ao passar o mouse (hover) deve exibir tooltip com nome do município e status

### 4. Barra de Pesquisa
- Campo de busca fixo no topo (ou próximo ao mapa) para localizar um município pelo nome
- Ao selecionar um resultado da busca, o mapa deve focar/destacar o município e permitir marcar como visitado diretamente pela busca (sem precisar clicar no mapa)
- Busca com autocomplete (debounce) para não sobrecarregar a UI

### 5. Estatísticas Dinâmicas
Em uma área visível da tela (sidebar ou painel superior), exibir, de acordo com o escopo atualmente selecionado (Brasil, região ou estado):
- **Total de municípios no escopo** (ex: 167 no RN, ~5.570 no Brasil)
- **Quantidade de municípios visitados dentro desse escopo**
- **Percentual visitado** = (visitados no escopo / total no escopo) × 100
- Esses números devem **recalcular automaticamente** ao trocar de escopo (Brasil → Estado → Região), já que a base de cálculo muda
- Bônus: um pequeno gráfico (barra de progresso ou anel/donut) representando visualmente a porcentagem

### 6. Persistência
- Os municípios visitados de cada usuário devem ser salvos no banco de dados (Neon/PostgreSQL) via Prisma, não apenas no localStorage
- Ações de marcar/desmarcar devem sincronizar com o backend de forma otimista (atualiza a UI imediatamente e confirma com o servidor em segundo plano)

## Modelagem de Dados (sugestão inicial)

```
User (id, name, email, passwordHash, createdAt)
Municipality (ibgeCode, name, stateCode, stateName, regionName) — tabela de referência, populada a partir da API do IBGE
VisitedMunicipality (id, userId, municipalityIbgeCode, visitedAt)
```

## Estrutura de Páginas

- `/login` e `/cadastro`
- `/dashboard` — mapa principal com seletor de escopo (Brasil/Região/Estado), barra de pesquisa e painel de estatísticas
- `/perfil` — dados do usuário (opcional, para uma primeira versão)

## Requisitos de Qualidade

- Responsivo (funcionar bem em mobile, já que o mapa precisa ser usável em telas pequenas — considerar zoom/pan)
- Tratamento de erros e estados de carregamento (skeletons) claros
- Código organizado em componentes reutilizáveis, hooks customizados para lógica de mapa e estatísticas
- Variáveis de ambiente para a connection string do Neon e segredos de autenticação (`.env.local`, com `.env.example` documentado)

## Passos Sugeridos de Implementação

1. Inicializar projeto Next.js + TypeScript + Tailwind + shadcn/ui
2. Configurar Prisma + Neon (schema inicial e migrations)
3. Implementar autenticação (Auth.js)
4. Criar script para popular a tabela `Municipality` a partir da API do IBGE
5. Construir o componente de mapa com drill-down (Brasil → Região/Estado → Município)
6. Implementar marcação de visitado/não visitado com persistência via API Routes
7. Implementar barra de pesquisa com autocomplete
8. Implementar painel de estatísticas dinâmico
9. Ajustes de responsividade e revisão de acessibilidade
10. Deploy na Vercel com variáveis de ambiente do Neon configuradas

Comece pela etapa 1 e vá me mostrando o progresso a cada etapa concluída, perguntando antes de avançar para a próxima caso haja decisões de arquitetura a tomar.
