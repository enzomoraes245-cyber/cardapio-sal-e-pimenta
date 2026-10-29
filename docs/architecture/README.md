# Arquitetura

## Visão geral

Monorepo com npm workspaces e duas aplicações independentes, sem microsserviços:

| Aplicação  | Responsabilidade                                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `backend`  | API REST `/api/v1`, regras de negócio, autenticação, isolamento entre restaurantes                                               |
| `frontend` | SPA React com três áreas: cardápio público (`/cardapio/:slug`), retaguarda (`/admin`) e backoffice da plataforma (`/backoffice`) |

## Backend

### Camadas

```text
Route ──► Controller ──► Service ──► Repository ──► Prisma ──► PostgreSQL
  │            │             │
  │            │             └─ regras de negócio, orquestração, publicação de eventos
  │            └─ lê req.validated / req.tenant, devolve { data }
  └─ caminho + middlewares (validate, auth, tenant)
```

- **Routes** só declaram caminhos e middlewares.
- **Controllers** traduzem HTTP ↔ service. Não contêm regras de negócio.
- **Services** concentram regras e lançam `AppError` (ex.: `NotFoundError`).
- **Repositories** são o único ponto de acesso ao Prisma e selecionam campos explicitamente.
- **Validators** (Zod) definem o formato aceito; campos desconhecidos são descartados.

Módulos simples recebem só as camadas que usam (ex.: `availability` reutiliza o repository de
`products`; `restaurants` concentra slug e módulos liberáveis).

### Módulos

| Módulo                 | Requisitos     | Papel                                                                  |
| ---------------------- | -------------- | ---------------------------------------------------------------------- |
| `auth`                 | MOD-01         | Login, logout e sessão da retaguarda; bloqueio de restaurante suspenso |
| `categories`           | MOD-02         | Cadastro, renomeação e ordenação                                       |
| `products`             | MOD-03, MOD-05 | Cadastro com foto, edição, substituição de foto, ordenação             |
| `availability`         | MOD-04         | Ativo/inativo e disponível/indisponível                                |
| `menu`                 | MOD-06, MOD-08 | Cardápio público e stream SSE                                          |
| `qrcode`               | MOD-09         | URL pública e PNG do QR Code                                           |
| `customization`        | MOD-10         | Nome, logotipo e cores                                                 |
| `restaurants`          | —              | Slug público e módulos liberáveis (`restaurant-features.js`)           |
| `platform/auth`        | DEC-006        | Login dos operadores do backoffice (sessão própria)                    |
| `platform/restaurants` | DEC-006        | Cadastro de restaurantes, suspensão, módulos e administradores         |
| `platform/billing`     | DEC-006        | Assinaturas, geração de faturas mensais e baixa manual                 |

O MOD-07 (modal de detalhes) é só de interface: usa os dados do cardápio público.

### Respostas da API

- Sucesso: `{ "data": ... }`
- Erro: `{ "error": { "code": "NOT_FOUND", "message": "...", "details": [...] } }`

O `error.middleware` centraliza a conversão. Erros inesperados retornam 500 genérico e são
registrados no log, sem expor detalhes internos.

## Multi-tenancy e segurança

Banco compartilhado com isolamento lógico por `restaurant_id`.

1. **Rotas administrativas** (`/api/v1/admin/*`) passam por `requireAdmin` (sessão válida via
   cookie HttpOnly) e `requireTenant`, que define `req.tenant.restaurantId` **a partir da sessão**.
   Qualquer `restaurantId` enviado pelo cliente é ignorado; services e repositories administrativos
   devem sempre filtrar por `req.tenant.restaurantId`.
2. **Rotas públicas** (`/api/v1/public/restaurants/:slug/*`) identificam o restaurante pelo slug
   da URL e selecionam somente campos publicáveis.
3. **No banco**, a FK composta `products(category_id, restaurant_id) → categories(id, restaurant_id)`
   impede que um produto aponte para a categoria de outro restaurante, mesmo com bug na aplicação.
4. **Sessões**: token aleatório de 32 bytes no cookie `HttpOnly`, `SameSite=Lax` e `Secure` em
   produção; o banco guarda só o SHA-256. Retaguarda (`cd_session`) e backoffice
   (`cd_platform_session`) usam tabelas e cookies separados.
5. **Login**: mensagem genérica, comparação em tempo constante mesmo para e-mail inexistente e limite
   de 10 tentativas falhas por IP + e-mail a cada 15 minutos. Restaurante suspenso é informado só
   depois de a senha ser validada.
6. **CSRF**: além do `SameSite=Lax`, escritas com cabeçalho `Origin` só são aceitas de
   `APP_PUBLIC_URL` (`same-origin.middleware`).
7. **Senhas**: scrypt (nativo do Node, parâmetros OWASP), sem dependência nativa externa.
8. **Headers**: Helmet. **CORS**: desligado por padrão (mesma origem); allowlist via `CORS_ORIGINS`.
9. **Configuração**: segredos só em variáveis de ambiente, validadas com Zod na inicialização.
10. **Imagens**: `multer` em memória (5 MB, 1 arquivo) e validação pela assinatura binária
    (JPEG/PNG/WebP), não pela extensão. As chaves são geradas pelo servidor
    (`restaurants/{restaurantId}/{products|logo}/{uuid}.{ext}`): sem path traversal e sem mistura
    entre restaurantes (CA-009). O banco guarda só a chave; a foto anterior é apagada depois de
    salvar a nova. O driver `local` serve de `/uploads`; um driver de objeto (S3/R2) pode
    substituí-lo sem migrar dados.

## Backoffice da plataforma (DEC-006)

- **Suspensão**: `requireAdmin` recusa sessões de restaurante suspenso (`403 RESTAURANT_SUSPENDED`),
  o login também, e o cardápio público responde 403. O stream SSE continua aceito para que os
  cardápios abertos voltem sozinhos na reativação. Slug e QR Code não mudam.
- **Módulos liberáveis**: `restaurant_features` (sem linha = liberado). `requireFeature` protege as
  rotas de personalização e QR Code; o cardápio público devolve `features` e, sem personalização,
  usa o visual padrão. Mudanças publicam `menu.updated`, então os cardápios abertos reagem na hora.
- **Cobrança manual**: faturas mensais geradas sob demanda (idempotente por
  `(restaurant_id, reference_month)`); "vencida" é calculada (`OPEN` com vencimento no passado).
  Não há gateway de pagamento.
- **Primeiro operador**: `npm run platform:create-admin -w backend` (senha via variável de ambiente).

## Atualização em tempo real (SSE)

```text
Service administrativo ──publishMenuUpdated(restaurantId)──► menu-events (Map restaurantId → assinantes)
                                                                   │
GET /public/restaurants/:slug/events ◄── somente assinantes daquele restaurante
        │
        └─► navegador: EventSource ──"menu.updated"──► recarrega GET /menu
```

- O evento é apenas um sinal (`{ type, at }`), sem dados: o cliente busca de novo o cardápio
  público, então nada administrativo trafega pelo canal.
- A cada (re)conexão o servidor envia `ready`; o frontend recarrega o cardápio depois de uma
  reconexão para recuperar eventos perdidos.
- `retry: 3000` orienta a reconexão automática do navegador; se a conexão for encerrada de vez,
  o hook `useMenuEvents` reabre após 5 s.
- O servidor envia o evento `ping` a cada 20 s (mantém proxies abertos). Se o navegador ficar 45 s
  sem receber nenhum evento, o hook considera a conexão "meio aberta" (comum em redes móveis ou
  quando um proxy não repassa a queda da API), reconecta e recarrega o cardápio.
- Busca e categoria selecionada ficam no estado da página, separado dos dados, e sobrevivem às
  atualizações. Produtos indisponíveis somem porque a API não os retorna.
- **Limite conhecido**: o barramento é em memória (um processo). Para mais de uma instância da
  API, propagar eventos com `LISTEN/NOTIFY` do PostgreSQL, sem broker externo.

## Frontend

- `app/` monta providers e rotas. `AdminApp` (retaguarda) e `BackofficeApp` são carregados com
  `React.lazy`: o celular que abre o cardápio não baixa o código administrativo.
- `SessionProvider`, `RequireAuth` e `LoginPage` são compartilhados pelas duas áreas autenticadas;
  cada uma informa seu serviço de sessão e seus caminhos.
- `features/<domínio>/` agrupa `pages`, `components`, `hooks`, `services`, `validators` (Zod) e
  `utils`. O backoffice fica em `features/platform/{auth,restaurants,billing}`.
- Chamadas HTTP ficam em `services` (cliente central em `src/services/api.js`, com suporte a
  `FormData`); componentes visuais não chamam `fetch`. `useResource` e `useSubmit` padronizam
  carregamento, erro, vazio e envio.
- Cardápio público mobile-first: coluna única, busca com 16 px (evita zoom no iOS), sem rolagem
  horizontal (CA-021).
- **Cores do restaurante (CA-033)**: `getBrandStyle` define `--color-brand` e `--color-brand-soft` e
  calcula, por contraste WCAG, a cor do texto sobre cada uma (`--color-brand-contrast`,
  `--color-brand-soft-contrast`) e uma variante da cor principal segura sobre branco
  (`--color-brand-text`, usada no preço).
- **Modal de detalhes (MOD-07)**: `<dialog>` nativo com `showModal()` (foco preso, Esc), clique no
  fundo para fechar e retorno do foco ao card. Não há troca de rota, então busca, categoria e
  rolagem são preservadas (CA-024); `html:has(dialog[open])` trava a rolagem de fundo. Se o produto
  deixar de estar disponível com o modal aberto, ele fecha.
- Ordenação na retaguarda por botões ↑/↓ acessíveis (sem biblioteca de arrastar e soltar).

## Decisões de versão

- **Prisma 6** em vez de 7: o gerador do Prisma 7 emite código TypeScript e exige driver adapters;
  o projeto é JavaScript puro nesta versão. A migração para o 7 pode ser feita depois sem mudar o schema.
- **Express 5**: erros em handlers `async` chegam ao middleware de erro sem wrappers.
- **ESLint 10** sem `eslint-plugin-react`: o ESLint 10 já reconhece o uso de componentes em JSX
  e o plugin ainda não suporta essa versão. As regras de hooks vêm de `eslint-plugin-react-hooks`.
- **Override de `deepmerge-ts` 8**: corrige o alerta de segurança GHSA-ggr8-5vv4-36mx herdado da
  CLI do Prisma 6 (ferramenta de desenvolvimento) sem trocar de versão major.
