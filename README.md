# Cardápio Digital

Sistema SaaS multi-restaurante para publicação de cardápios acessados por QR Code.

Cada restaurante tem sua retaguarda, categorias, produtos (preços, fotos e disponibilidade),
identidade visual, URL pública e QR Code. O cliente final abre o cardápio no celular, sem login,
e vê as alterações da retaguarda automaticamente, mesmo com a página aberta.

> **Situação:** MVP da [especificação funcional v1.0](docs/requirements/especificacao-funcional-v1.md)
> implementado (MOD-01 a MOD-10), mais o **backoffice da plataforma** aprovado como revisão de escopo
> (DEC-006): cadastro de restaurantes, mensalidades com cobrança manual, suspensão e liberação de
> módulos por restaurante.

## 1. Visão geral

```text
Celular do cliente ──► /cardapio/:slug ──► /api/v1/public/...   ──┐
Retaguarda         ──► /admin          ──► /api/v1/admin/...    ──┼─► Backend (Express) ──► PostgreSQL
Backoffice         ──► /backoffice     ──► /api/v1/platform/... ──┘          │
                                                                      SSE por restaurante
```

- **Backend** (`backend/`): regras de negócio, autenticação, isolamento entre restaurantes e persistência.
- **Frontend** (`frontend/`): cardápio público (`/cardapio/:slug`), retaguarda do restaurante
  (`/admin`) e backoffice da plataforma (`/backoffice`). Retaguarda e backoffice são carregados sob
  demanda e não pesam no cardápio do celular.

Detalhes em [docs/architecture](docs/architecture/README.md).

## 2. Tecnologias

| Camada    | Tecnologias                                                                     |
| --------- | ------------------------------------------------------------------------------- |
| Backend   | Node.js 24 LTS, Express 5, Prisma 6, PostgreSQL 17, Zod 4, Helmet, Multer, SSE  |
| Frontend  | React 19, Vite 8, React Router 8, Tailwind CSS 4, Zod 4, Fetch API centralizada |
| Qualidade | ESLint 10, Prettier 3, Vitest 5, Supertest, Testing Library                     |
| Infra     | Docker Compose (PostgreSQL local), npm workspaces                               |

## 3. Estrutura de diretórios

```text
cardapio-digital/
├── backend/
│   ├── prisma/                 # schema.prisma, migrations/, seed.js
│   ├── scripts/                # create-platform-admin.js (primeiro operador do backoffice)
│   ├── src/
│   │   ├── config/             # env.js (validação), database.js (Prisma), storage.js
│   │   ├── middlewares/        # auth, tenant, feature, platform-auth, same-origin, validate, error
│   │   ├── modules/            # um diretório por domínio (routes → controller → service → repository)
│   │   ├── routes/index.js     # monta /api/v1 (health, auth, public, admin, platform)
│   │   ├── shared/             # errors/, events/ (SSE por restaurante), utils/
│   │   ├── app.js              # cria a aplicação Express
│   │   └── server.js           # abre a porta e trata encerramento
│   └── tests/                  # unit/ e integration/
├── frontend/
│   ├── src/
│   │   ├── app/                # App, router, providers, AdminApp, BackofficeApp
│   │   ├── layouts/            # AdminLayout, BackofficeLayout, PublicMenuLayout
│   │   ├── features/           # um diretório por funcionalidade
│   │   ├── components/         # ui/ (genéricos) e shared/ (da aplicação)
│   │   ├── hooks/ services/ utils/ styles/
│   │   └── main.jsx
│   └── tests/
├── docs/                       # architecture/, database/, api/, requirements/
├── docker-compose.yml
├── eslint.config.js
└── package.json                # workspaces e scripts globais
```

Módulos do backend: `auth`, `restaurants`, `categories`, `products`, `availability`,
`customization`, `qrcode`, `menu` e `platform/{auth,restaurants,billing}`. O frontend tem uma pasta
correspondente em `features/`.

## 4. Requisitos

- **Node.js 24 LTS** (mínimo 22.22.2) e npm 10+
- **Docker Desktop** (com WSL2 no Windows) **ou** um PostgreSQL 15+ acessível
- Git

## 5. Variáveis de ambiente

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**Backend (`backend/.env`)**

| Variável                                                     | Descrição                                                         | Padrão                  |
| ------------------------------------------------------------ | ----------------------------------------------------------------- | ----------------------- |
| `NODE_ENV`                                                   | `development`, `test` ou `production`                             | `development`           |
| `PORT`                                                       | Porta da API                                                      | `3333`                  |
| `DATABASE_URL`                                               | URL de conexão PostgreSQL (**obrigatória**)                       | —                       |
| `CORS_ORIGINS`                                               | Origens permitidas, separadas por vírgula. Vazio = mesma origem   | vazio                   |
| `APP_PUBLIC_URL`                                             | Endereço do frontend: base do QR Code e origem aceita em escritas | `http://localhost:5173` |
| `SESSION_COOKIE_NAME`                                        | Cookie de sessão da retaguarda                                    | `cd_session`            |
| `SESSION_TTL_HOURS`                                          | Validade das sessões (retaguarda e backoffice), em horas          | `12`                    |
| `PLATFORM_SESSION_COOKIE_NAME`                               | Cookie de sessão do backoffice                                    | `cd_platform_session`   |
| `STORAGE_DRIVER`                                             | Armazenamento de imagens (por enquanto só `local`)                | `local`                 |
| `STORAGE_LOCAL_DIR`                                          | Pasta dos arquivos do driver local                                | `storage/uploads`       |
| `UPLOAD_MAX_BYTES`                                           | Tamanho máximo de cada imagem (fotos e logotipo)                  | `5242880` (5 MB)        |
| `SEED_ADMIN_EMAIL`                                           | E-mail do admin criado pelo seed                                  | —                       |
| `SEED_ADMIN_PASSWORD`                                        | Senha do admin do seed (mín. 8). Vazio = não cria o usuário       | —                       |
| `SEED_PLATFORM_ADMIN_EMAIL` / `SEED_PLATFORM_ADMIN_PASSWORD` | Operador do backoffice criado pelo seed. Vazio = não cria         | —                       |

A API valida as variáveis ao iniciar e encerra com mensagem clara se alguma for inválida.

**Frontend (`frontend/.env`)**

| Variável            | Descrição                                                           | Padrão                  |
| ------------------- | ------------------------------------------------------------------- | ----------------------- |
| `VITE_API_BASE_URL` | Base da API usada pelo navegador (vai para o bundle público)        | `/api/v1`               |
| `API_PROXY_TARGET`  | Destino do proxy do Vite em desenvolvimento (não vai para o bundle) | `http://localhost:3333` |

> Toda variável `VITE_*` fica visível no navegador. Nunca coloque segredos no frontend.

## 6. PostgreSQL

```bash
npm run db:up
```

Sobe o container `cardapio-digital-postgres` (PostgreSQL 17, porta 5432, usuário/senha `cardapio`).
Para usar um PostgreSQL já instalado, basta ajustar `DATABASE_URL` em `backend/.env`.

## 7. Instalação e migrations

```bash
npm install          # instala os dois workspaces e gera o Prisma Client
npm run db:migrate   # aplica as migrations (prisma migrate dev)
npm run db:seed      # opcional: 4 restaurantes de demonstração (prisma/seed-data.js) e operador
```

Em produção, use `npm run db:deploy -w backend` (aplica migrations sem gerar novas).

Primeiro operador do backoffice em produção (a senha vem só da variável de ambiente, para não ficar
no histórico de comandos):

```bash
PLATFORM_ADMIN_PASSWORD='defina-uma-senha-forte' npm run platform:create-admin -w backend -- --email=ops@suaempresa.com --name="Operação"
```

> **Windows:** pare o backend antes de `db:migrate` ou `prisma generate`. Com a API rodando, o
> Windows bloqueia a DLL do Prisma e a geração do client falha com `EPERM` (a migration é aplicada
> mesmo assim).
>
> **npm 11:** os scripts de instalação do Prisma estão aprovados em `allowScripts` no
> `package.json` raiz. Ao atualizar o Prisma, aprove a nova versão com
> `npm install-scripts approve @prisma/client @prisma/engines prisma`.

## 8. Backend

```bash
npm run dev:backend
```

API em `http://localhost:3333/api/v1`. Teste rápido:

```bash
curl http://localhost:3333/api/v1/health
```

Resposta esperada: `{"data":{"status":"ok","database":"up","timestamp":"..."}}`.

## 9. Frontend

Em outro terminal:

```bash
npm run dev:frontend
```

- Cardápio público de demonstração: `http://localhost:5173/cardapio/demo`.
- Retaguarda do restaurante: `http://localhost:5173/admin` (usuário `SEED_ADMIN_EMAIL`).
- Backoffice da plataforma: `http://localhost:5173/backoffice` (usuário `SEED_PLATFORM_ADMIN_EMAIL`).

Fotos e logotipos ficam em `backend/storage/uploads` (driver local, fora do Git).

O Vite encaminha `/api` e `/uploads` para o backend, então frontend e API ficam na mesma origem
(sem CORS em desenvolvimento e com cookies de sessão funcionando normalmente).

## 10. Testes e qualidade

```bash
npm test               # testes do backend e do frontend
npm run test -w backend
npm run test -w frontend
npm run lint           # ESLint
npm run format:check   # Prettier
```

Os testes de integração do backend usam o PostgreSQL configurado em `DATABASE_URL`. Eles criam
restaurantes próprios com slugs aleatórios e os removem ao final, sem tocar nos dados existentes.

## Documentação

- [Arquitetura](docs/architecture/README.md)
- [Banco de dados](docs/database/README.md)
- [API](docs/api/README.md)
- [Especificação funcional v1.0](docs/requirements/especificacao-funcional-v1.md)
- [Revisões de escopo e definições técnicas](docs/requirements/README.md)
