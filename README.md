# A Taverna

Aplicacao web para gestao de campanha de RPG com foco em fichas, sessoes, notas e consulta de PDFs. O projeto funciona offline com persistencia local e sincroniza com Supabase quando disponivel.

## Stack Tecnica

- React 19 + TypeScript
- React Router DOM 7
- Vite (rolldown-vite)
- Supabase JS v2 (autenticacao e sync em nuvem)
- SQLite no browser via `sql.js` (WASM)
- IndexedDB para biblioteca de PDFs
- ESLint 9

## Funcionalidades Principais

- Dashboard com resumo da campanha
- Cadastro e edicao de personagens
- Ficha detalhada por personagem
- Agenda de sessoes
- Notas da campanha
- Login/registro (Supabase)
- Biblioteca de PDFs por sistema (armazenamento local)
- Fallback offline de dados

## Rotas Atuais

As rotas estao centralizadas em `src/app/routes.ts`.

- `/dashboard`
- `/characters`
- `/characters/:id`
- `/sessions`
- `/notes`
- `/login`
- `/settings` (redirect para `/login`)
- `*` (NotFound)

As paginas sao carregadas com lazy loading em `src/app/router.tsx`.

## Persistencia de Dados

A aplicacao usa estrategia em camadas:

1. `localStorage` (`src/store/rpgStorage.ts`)
- Chave: `rpg-dashboard:data`
- Carregamento inicial rapido

2. SQLite local no navegador (`src/store/sqliteStorage.ts`)
- Implementacao com `sql.js`
- Banco serializado em base64 no `localStorage`
- Chave do banco: `rpg-dashboard:sqlite-db`
- Tabela interna: `app_store`
- Registro principal: `rpg-data-v1`

3. Supabase (opcional)
- Leitura/escrita da tabela `rpg_data`
- Sync com debounce de 600ms nas alteracoes
- Quando nuvem falha, app continua local

Fluxo resumido do provider (`src/store/RpgDataProvider.tsx`):
- Inicializa com `localStorage`
- Hidrata do SQLite
- Se autenticado e Supabase disponivel, sincroniza com nuvem
- Toda alteracao salva localmente (`localStorage` + SQLite)

## Autenticacao (Supabase)

Implementada em `src/contexts/AuthContext.tsx`.

- Busca de sessao no startup com timeout de 5s
- Evita tela presa em loading quando backend esta offline
- `signIn`, `signUp` e `signOut` via Supabase Auth

Configuracao do client em `src/services/supabaseClient.ts`:
- `autoRefreshToken: false`
- `persistSession: true`

Isso reduz loops de refresh token quando o host do Supabase esta indisponivel.

## Variaveis de Ambiente

Crie um arquivo `.env.local` na raiz:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SEU_ANON_KEY
```

Se nao configurar essas variaveis, o app funciona em modo local/offline.

## Supabase - Estrutura Minima Esperada

Tabela usada para sync:

- `rpg_data`
  - `user_id` (uuid, PK ou unique, referencia auth.users.id)
  - `data` (jsonb)
  - `updated_at` (timestamptz)

Exemplo SQL basico:

```sql
create table if not exists public.rpg_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
```

Recomendado: habilitar RLS e permitir cada usuario acessar apenas sua propria linha.

Tabela usada para busca social e perfil publico:

- `profiles`
  - `id` (uuid, PK, referencia `auth.users.id`)
  - `username` (text unico, ex: `mestrearcano`)
  - `display_name` (text)
  - `bio` (text, opcional)
  - `avatar_url` (text, opcional)
  - `badge` (text, opcional)
  - `email_notifications` (boolean)
  - `obsidian_theme` (boolean)
  - `dice_sound` (boolean)
  - `created_at` / `updated_at` (timestamptz)

Migration pronta no projeto:

- `supabase/migrations/20260325_create_profiles.sql`

Ela inclui:

- criacao da tabela `profiles`
- trigger para criar perfil automaticamente apos novo registro em `auth.users`
- backfill para usuarios ja existentes
- politicas RLS para leitura publica e escrita apenas do proprio usuario

Tabela usada para solicitacoes de amizade:

- `friend_requests`
  - `id` (uuid, PK)
  - `requester_id` (uuid, referencia `auth.users.id`)
  - `addressee_id` (uuid, referencia `auth.users.id`)
  - `status` (`pending | accepted | rejected | cancelled`)
  - `created_at` / `updated_at`

Migration pronta no projeto:

- `supabase/migrations/20260325_create_friend_requests.sql`

Tabela normalizada de personagens (vinculada ao usuario dono):

- `characters`
  - `id` (uuid, PK)
  - `owner_id` (uuid, referencia `auth.users.id`)
  - `name`, `system`, `player_name`
  - `avatar_url`, `background`, `is_npc`
  - `created_at` / `updated_at`

Tabela especifica de Savage Pathfinder (1:1 com `characters`):

- `character_savage_pathfinder`
  - `character_id` (PK/FK -> `characters.id`)
  - `class_name`, `race`, `ancestry`, `height`, `weight`
  - `edges`, `conviction`, `rank`
  - `stats` (jsonb), `attributes` (jsonb), `modules` (jsonb)

Tabela de fallback para outros sistemas (1:1 com `characters`):

- `character_generic`
  - `character_id` (PK/FK -> `characters.id`)
  - `payload` (jsonb com campos especificos do sistema)

Migrations prontas no projeto:

- `supabase/migrations/20260325_create_characters_and_extend_profiles.sql`
- `supabase/migrations/20260325_split_characters_by_system.sql`

## Migrations Remotas (Automatizadas)

O projeto possui workflow para aplicar migrations automaticamente no Supabase remoto:

- `.github/workflows/supabase-migrations.yml`

Secrets necessarios no GitHub:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`

Scripts locais:

```bash
npm run db:migrations:list
npm run db:migrate:remote
```

## Biblioteca de PDFs

Modulo: `src/services/pdfStorage.ts`

- Usa IndexedDB (`rpg-reference-db`)
- Store: `pdfs`
- Salva blob do arquivo + metadados
- Permite listar, abrir e remover PDFs

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
npm run deploy
```

## Deploy

O deploy atual usa GitHub Pages com `gh-pages`:

- `npm run predeploy` executa build
- `npm run deploy` publica `dist/`

## Estrutura Relevante

```text
src/
  app/
    router.tsx
    routes.ts
    shell/
  contexts/
    AuthContext.tsx
  pages/
  services/
    supabaseClient.ts
    pdfStorage.ts
  store/
    RpgDataProvider.tsx
    rpgStorage.ts
    sqliteStorage.ts
```

## Observacoes

- O projeto prioriza continuidade offline.
- Mesmo com falha de DNS ou indisponibilidade do Supabase, os dados continuam operando localmente.
- Para sincronizacao em nuvem, confirme que a URL do projeto Supabase esta correta.

## Arquitetura Alvo (Backend)

Para evolucao gradual para backend com DDD + Hexagonal (Ports and Adapters), consulte:

- `docs/arquitetura-hexagonal-ddd.md`
- `docs/api-character-v1.md`
- `docs/backend-stack-recomendado.md`
- `docs/adr/0001-arquitetura-backend-ddd-hexagonal.md`
- `docs/estrategia-testes-antes-backend.md`
- `docs/cenarios-teste-criacao-sessao.md`
- `docs/cenarios-teste-ficha-modulos.md`

