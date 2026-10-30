# Cardápio Digital

Sistema SaaS multi-restaurante para publicação de cardápios acessados por QR Code.

Cada restaurante tem sua retaguarda, categorias, produtos (preços, fotos e disponibilidade),
identidade visual, URL pública e QR Code. O cliente final abre o cardápio no celular, sem login,
e vê as alterações da retaguarda automaticamente, mesmo com a página aberta.

> **Situação:** MVP da [especificação funcional v1.0](docs/requirements/especificacao-funcional-v1.md)
> implementado (MOD-01 a MOD-10), mais o **backoffice da plataforma** (DEC-006) e as revisões
> DEC-007 a DEC-011: foto opcional no cadastro, cardápio sem pedido, dados do estabelecimento,
> recuperação de senha por e-mail (provedor pendente), pagamentos com estorno e cancelamento com
> motivo, histórico de ações, bloqueio de responsáveis e categorias ocultas. As áreas
> administrativas têm design system próprio; o cardápio público mantém o visual original.

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
  demanda e não pesam no JavaScript do cardápio do celular.

Detalhes em [docs/architecture](docs/architecture/README.md).

## 2. Tecnologias

| Camada    | Tecnologias                                                                     |
| --------- | ------------------------------------------------------------------------------- |
| Backend   | Node.js 24 LTS, Express 5, Prisma 6, PostgreSQL, Zod 4, Helmet, Multer, SSE     |
| Frontend  | React 19, Vite 8, React Router 8, Tailwind CSS 4, Zod 4, Fetch API centralizada |
| Qualidade | ESLint 10, Prettier 3, Vitest 5, Supertest, Testing Library                     |
| Infra     | npm workspaces; Docker Compose opcional (PostgreSQL local)                      |

PostgreSQL: desenvolvido e testado com a versão 18 instalada localmente; o `docker-compose.yml`
sobe a 17. Docker não é obrigatório.

## 3. Estrutura de diretórios

```text
cardapio-digital/
├── backend/
│   ├── prisma/                 # schema.prisma, migrations/, seed.js
│   ├── scripts/                # create-platform-admin.js (operador do backoffice)
│   ├── src/
│   │   ├── config/             # env.js (validação), database.js (Prisma), storage.js
│   │   ├── middlewares/        # auth, tenant, feature, platform-auth, same-origin, validate, error
│   │   ├── modules/            # um diretório por domínio (routes → controller → service → repository)
│   │   ├── routes/index.js     # monta /api/v1 (health, auth, public, admin, platform)
│   │   ├── shared/             # errors/, events/ (SSE por restaurante), mail/, utils/
│   │   ├── app.js              # cria a aplicação Express
│   │   └── server.js           # abre a porta e trata encerramento
│   └── tests/                  # unit/ e integration/
├── frontend/
│   ├── src/
│   │   ├── app/                # App, router, providers, AdminApp, BackofficeApp
│   │   ├── layouts/            # AdminShell, AdminLayout, BackofficeLayout, PublicMenuLayout
│   │   ├── features/           # um diretório por funcionalidade
│   │   ├── components/         # admin/ (design system administrativo), ui/ e shared/ (cardápio)
│   │   ├── hooks/ services/ utils/ styles/
│   │   └── main.jsx
│   └── tests/
├── docs/                       # architecture/, database/, api/, requirements/
├── docker-compose.yml
├── eslint.config.js            # inclui a fronteira que impede o cardápio de importar o admin
└── package.json                # workspaces e scripts globais
```

Módulos do backend: `auth`, `password-reset`, `establishment`, `restaurants`, `categories`,
`products`, `availability`, `customization`, `qrcode`, `menu`, `audit` e
`platform/{auth,restaurants,billing}`. O frontend tem uma pasta correspondente em `features/`.

## 4. Requisitos

- **Node.js 24 LTS** (mínimo 22.22.2) e npm 10+
- **PostgreSQL 15+** acessível (testado com 18) **ou** Docker Desktop para subir o container
- Git

## 5. Variáveis de ambiente

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**Backend (`backend/.env`)**

| Variável                                                     | Descrição                                                                                       | Padrão                                         |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `NODE_ENV`                                                   | `development`, `test` ou `production`                                                           | `development`                                  |
| `PORT`                                                       | Porta da API                                                                                    | `3333`                                         |
| `DATABASE_URL`                                               | URL de conexão PostgreSQL (**obrigatória**)                                                     | —                                              |
| `TEST_DATABASE_URL`                                          | Banco **exclusivo** dos testes de integração (o nome precisa conter `test`)                     | —                                              |
| `CORS_ORIGINS`                                               | Origens permitidas, separadas por vírgula. Vazio = mesma origem                                 | vazio                                          |
| `APP_PUBLIC_URL`                                             | Endereço do frontend: base do QR Code e origem aceita em escritas. Em produção, domínio público | `http://localhost:5173`                        |
| `TRUST_PROXY`                                                | Proxy reverso na frente da API: número de saltos (ex.: `1`) ou lista de IPs/sub-redes           | vazio (sem proxy)                              |
| `APP_TIMEZONE`                                               | Fuso do negócio (vencimentos, vencidas, data do pagamento)                                      | `America/Sao_Paulo`                            |
| `SESSION_COOKIE_NAME`                                        | Cookie de sessão da retaguarda                                                                  | `cd_session`                                   |
| `SESSION_TTL_HOURS`                                          | Validade das sessões (retaguarda e backoffice), em horas                                        | `12`                                           |
| `PLATFORM_SESSION_COOKIE_NAME`                               | Cookie de sessão do backoffice                                                                  | `cd_platform_session`                          |
| `MAIL_DRIVER`                                                | E-mail da recuperação de senha: `log` (console; só dev/testes) ou `disabled`                    | `log` fora de produção; `disabled` em produção |
| `MAIL_FROM`                                                  | Remetente das mensagens                                                                         | `Cardápio Digital <…>`                         |
| `PASSWORD_RESET_TTL_MINUTES`                                 | Validade do link de redefinição de senha (10–1440)                                              | `60`                                           |
| `STORAGE_DRIVER`                                             | Armazenamento de imagens (por enquanto só `local`)                                              | `local`                                        |
| `STORAGE_LOCAL_DIR`                                          | Pasta dos arquivos do driver local                                                              | `storage/uploads`                              |
| `UPLOAD_MAX_BYTES`                                           | Tamanho máximo de cada imagem (fotos e logotipo)                                                | `5242880` (5 MB)                               |
| `SEED_ADMIN_EMAIL`                                           | E-mail do admin criado pelo seed                                                                | —                                              |
| `SEED_ADMIN_PASSWORD`                                        | Senha do admin do seed (mín. 8). Vazio = não cria o usuário                                     | —                                              |
| `SEED_PLATFORM_ADMIN_EMAIL` / `SEED_PLATFORM_ADMIN_PASSWORD` | Operador do backoffice criado pelo seed. Vazio = não cria                                       | —                                              |

A API valida as variáveis ao iniciar e encerra com mensagem clara se alguma for inválida (em
produção, inclusive `APP_PUBLIC_URL` local ou de rede interna e `MAIL_DRIVER=log`).

**Frontend (`frontend/.env`)**

| Variável            | Descrição                                                           | Padrão                  |
| ------------------- | ------------------------------------------------------------------- | ----------------------- |
| `VITE_API_BASE_URL` | Base da API usada pelo navegador (vai para o bundle público)        | `/api/v1`               |
| `API_PROXY_TARGET`  | Destino do proxy do Vite em desenvolvimento (não vai para o bundle) | `http://localhost:3333` |

> Toda variável `VITE_*` fica visível no navegador. Nunca coloque segredos no frontend.

## 6. PostgreSQL

Com um PostgreSQL já instalado, basta ajustar `DATABASE_URL` em `backend/.env`. Com Docker:

```bash
npm run db:up
```

Sobe o container `cardapio-digital-postgres` (PostgreSQL 17, porta 5432, usuário/senha `cardapio`).

## 7. Instalação e migrations

```bash
npm install          # instala os dois workspaces e gera o Prisma Client
npm run db:migrate   # aplica as migrations (prisma migrate dev)
npm run db:seed      # opcional: restaurantes de demonstração (prisma/seed-data.js) e operador
```

> O seed **recria o cardápio** dos restaurantes de demonstração e redefine as senhas dessas contas;
> não roda com `NODE_ENV=production`. Não o execute em um banco com dados reais desses restaurantes.

Em produção, use `npm run db:deploy -w backend` (aplica migrations sem gerar novas).

Operador do backoffice (a senha vem só da variável de ambiente, para não ficar no histórico de
comandos; atualizar a senha de um operador existente encerra as sessões dele):

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
- Backoffice da plataforma: `http://localhost:5173/backoffice` (usuário `SEED_PLATFORM_ADMIN_EMAIL`);
  abre na Visão geral.

Fotos e logotipos ficam em `backend/storage/uploads` (driver local, fora do Git).

O Vite encaminha `/api` e `/uploads` para o backend, então frontend e API ficam na mesma origem
(sem CORS em desenvolvimento e com cookies de sessão funcionando normalmente). Para testar no
celular pela rede local, `npm run dev:celular`; o QR Code dessa forma só funciona na mesma rede
(o painel avisa).

## 10. Testes e qualidade

```bash
npm test               # testes do backend e do frontend
npm run test -w backend
npm run test -w frontend
npm run lint           # ESLint (inclui a fronteira cardápio × admin)
npm run format:check   # Prettier
```

Os testes de integração do backend criam e removem dados, por isso **exigem um banco exclusivo**:
defina `TEST_DATABASE_URL` em `backend/.env` (o nome do banco precisa conter `test`; os testes se
recusam a rodar sem ele) e aplique as migrations nesse banco antes da primeira execução:

```bash
DATABASE_URL="postgresql://cardapio:cardapio@localhost:5432/cardapio_digital_test?schema=public" npm run db:deploy -w backend
```

(No PowerShell: `$env:DATABASE_URL="..."; npm run db:deploy -w backend`.) Os arquivos de teste do
backend rodam um de cada vez, porque alguns conferem números de toda a plataforma.

## 11. Produção

- `APP_PUBLIC_URL` deve ser o **domínio público definitivo**: os QR Codes impressos apontam para
  ele, e trocá-lo depois os invalida. Com `https://`, os cookies de sessão passam a ser `Secure`.
- Atrás de nginx ou balanceador, defina `TRUST_PROXY` (ex.: `1`) para os limites de tentativas de
  login usarem o IP real do cliente.
- `backend/storage/uploads` precisa ser **persistente** (volume) e `/uploads` precisa ser servido
  no mesmo domínio público (proxy para a API, que serve os arquivos).
- E-mail: até o provedor ser definido, mantenha `MAIL_DRIVER=disabled` (a recuperação de senha
  fica oculta e o login orienta a procurar o suporte).
- Migrations com `npm run db:deploy -w backend`; nunca rode o seed em produção.
- O tempo real (SSE) funciona com uma instância da API; mais instâncias exigem propagar os eventos
  (ponto em aberto na documentação de requisitos).

## Documentação

- [Arquitetura](docs/architecture/README.md)
- [Banco de dados](docs/database/README.md)
- [API](docs/api/README.md)
- [Especificação funcional v1.0](docs/requirements/especificacao-funcional-v1.md)
- [Revisões de escopo e definições técnicas](docs/requirements/README.md)
