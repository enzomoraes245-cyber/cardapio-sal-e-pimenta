# Arquitetura

## Visão geral

Monorepo com npm workspaces e duas aplicações independentes, sem microsserviços:

| Aplicação  | Responsabilidade                                                                       |
| ---------- | -------------------------------------------------------------------------------------- |
| `backend`  | API REST `/api/v1`, regras de negócio, autenticação, isolamento entre restaurantes     |
| `frontend` | SPA React com duas áreas: retaguarda (`/admin`) e cardápio público (`/cardapio/:slug`) |

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

O módulo `menu` é a referência completa do padrão. Módulos simples recebem só as camadas que usam
(ex.: `restaurants` tem apenas repository e validator por enquanto).

### Módulos

| Módulo          | Papel                                                                        | Situação      |
| --------------- | ---------------------------------------------------------------------------- | ------------- |
| `auth`          | Sessão administrativa (resolução de token já pronta; login na próxima etapa) | parcial       |
| `restaurants`   | Contexto do restaurante: slug público, identificação do tenant               | parcial       |
| `menu`          | Consulta pública do cardápio publicado + stream SSE                          | implementado  |
| `categories`    | CRUD e ordenação de categorias                                               | próxima etapa |
| `products`      | CRUD, ordenação, preço e foto de produtos                                    | próxima etapa |
| `availability`  | Disponibilidade de produtos                                                  | próxima etapa |
| `customization` | Logotipo e cores                                                             | próxima etapa |
| `qrcode`        | Geração do QR Code da URL pública                                            | próxima etapa |

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
4. **Sessões**: o banco guarda só o SHA-256 do token. O cookie será `HttpOnly`, `SameSite=Lax` e
   `Secure` em produção (definido junto com o endpoint de login).
5. **Senhas**: scrypt (nativo do Node, parâmetros OWASP), sem dependência nativa externa.
6. **Headers**: Helmet. **CORS**: desligado por padrão (mesma origem); allowlist via `CORS_ORIGINS`.
7. **Configuração**: segredos só em variáveis de ambiente, validadas com Zod na inicialização.
8. **Imagens**: o banco guarda só a chave do arquivo (`image_key`, `logo_key`); `config/storage.js`
   monta a URL pública. O driver `local` serve de `/uploads`; um driver de objeto (S3/R2) pode
   substituí-lo sem migração de dados.

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

- `app/` monta providers e rotas; `layouts/` separa retaguarda e cardápio público.
- `features/<domínio>/` agrupa `pages`, `components`, `hooks`, `services` e `utils` da funcionalidade.
- Chamadas HTTP ficam em `services` (cliente central em `src/services/api.js`); componentes visuais
  não chamam `fetch`.
- Hooks tratam estados de carregamento, erro e ausência de dados.
- Cardápio público é mobile-first (coluna única, campo de busca com 16 px para evitar zoom no iOS)
  e aplica as cores do restaurante via variável CSS `--color-brand`.

## Decisões de versão

- **Prisma 6** em vez de 7: o gerador do Prisma 7 emite código TypeScript e exige driver adapters;
  o projeto é JavaScript puro nesta versão. A migração para o 7 pode ser feita depois sem mudar o schema.
- **ESLint 9** em vez de 10: `eslint-plugin-react` ainda não declara suporte ao ESLint 10.
- **Express 5**: erros em handlers `async` chegam ao middleware de erro sem wrappers.
- **ESLint 10** sem `eslint-plugin-react`: o ESLint 10 já reconhece o uso de componentes em JSX
  e o plugin ainda não suporta essa versão. As regras de hooks vêm de `eslint-plugin-react-hooks`.
- **Override de `deepmerge-ts` 8**: corrige o alerta de segurança GHSA-ggr8-5vv4-36mx herdado da
  CLI do Prisma 6 (ferramenta de desenvolvimento) sem trocar de versão major.
