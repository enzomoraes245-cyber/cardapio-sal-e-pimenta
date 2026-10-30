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

| Módulo                 | Requisitos       | Papel                                                                                    |
| ---------------------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `auth`                 | MOD-01           | Login, logout, sessão e troca de senha da retaguarda; bloqueio de suspenso/bloqueado     |
| `password-reset`       | DEC-010          | Recuperação de senha por e-mail (retaguarda e backoffice), token de uso único            |
| `establishment`        | DEC-009          | Nome exibido e contato do estabelecimento (sempre liberado)                              |
| `categories`           | MOD-02, DEC-011  | Cadastro, renomeação, ordenação e categoria oculta                                       |
| `products`             | MOD-03, MOD-05   | Cadastro (foto opcional, DEC-007), edição, troca e remoção de foto, ordenação            |
| `availability`         | MOD-04           | Ativo/inativo e disponível/indisponível                                                  |
| `menu`                 | MOD-06, MOD-08   | Cardápio público e stream SSE                                                            |
| `qrcode`               | MOD-09           | URL pública, tipo do endereço, PNG e SVG do QR Code                                      |
| `customization`        | MOD-10           | Logotipo e cores                                                                         |
| `restaurants`          | —                | Slug público e módulos liberáveis (`restaurant-features.js`)                             |
| `audit`                | DEC-011          | Histórico de ações (`audit_events`), gravado na mesma transação da alteração             |
| `platform/auth`        | DEC-006          | Login, troca e recuperação de senha dos operadores (sessão própria)                      |
| `platform/restaurants` | DEC-006, DEC-011 | Cadastro e dados de restaurantes, suspensão/reativação com motivo, módulos, responsáveis |
| `platform/billing`     | DEC-006, DEC-011 | Assinaturas, mensalidades, pagamentos, estornos, cancelamentos e visão geral             |

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
   produção ou quando `APP_PUBLIC_URL` é HTTPS; o banco guarda só o SHA-256. Retaguarda
   (`cd_session`) e backoffice (`cd_platform_session`) usam tabelas e cookies separados. Troca ou
   redefinição de senha (inclusive pelo script de operador e pelo seed) encerra as sessões; sessões
   expiradas são limpas no login.
5. **Login**: mensagem genérica, comparação em tempo constante mesmo para e-mail inexistente e
   limites de tentativas falhas (10 por IP + e-mail e 50 por IP, a cada 15 minutos). Restaurante
   suspenso e responsável bloqueado são informados só depois de a senha ser validada. A
   recuperação de senha tem limites próprios (5 por IP + e-mail e 20 por IP, por hora) e nunca
   revela se o e-mail existe. Atrás de proxy reverso, `TRUST_PROXY` informa ao Express de onde vem
   o IP do cliente.
6. **CSRF**: além do `SameSite=Lax`, escritas com cabeçalho `Origin` só são aceitas de
   `APP_PUBLIC_URL` (`same-origin.middleware`).
7. **Senhas**: scrypt (nativo do Node, parâmetros OWASP), sem dependência nativa externa.
8. **Headers**: Helmet. **CORS**: desligado por padrão (mesma origem); allowlist via `CORS_ORIGINS`.
9. **Configuração**: segredos só em variáveis de ambiente, validadas com Zod na inicialização. Em
   produção, `APP_PUBLIC_URL` precisa ser um endereço público (os QR Codes impressos apontam para
   ele) e o driver de e-mail `log` é recusado.
10. **Imagens**: `multer` em memória (5 MB, 1 arquivo) e validação pela assinatura binária
    (JPEG/PNG/WebP), não pela extensão. Corpo multipart malformado responde 400 e cada limite tem
    mensagem própria. As chaves são geradas pelo servidor
    (`restaurants/{restaurantId}/{products|logo}/{uuid}.{ext}`): sem path traversal e sem mistura
    entre restaurantes (CA-009). Na troca, a chave anterior é lida com `SELECT … FOR UPDATE` na
    mesma transação e o arquivo antigo só é apagado depois do commit (sem órfãos em trocas
    simultâneas). O driver `local` serve de `/uploads`; um driver de objeto (S3/R2) pode
    substituí-lo sem migrar dados.
11. **Envios repetidos**: cadastros aceitam `Idempotency-Key` (tabela `idempotency_keys`, chave
    criada na mesma transação do registro); transições de situação (pagar, estornar, cancelar,
    suspender, bloquear) são atualizações condicionais, então duas operações simultâneas não se
    sobrepõem.
12. **Histórico**: `audit_events` registra autor, data, motivo e valores anteriores/novos na mesma
    transação da alteração; a aplicação não oferece edição nem exclusão.

## Backoffice da plataforma (DEC-006)

- **Suspensão**: `requireAdmin` recusa sessões de restaurante suspenso (`403 RESTAURANT_SUSPENDED`),
  o login também, e o cardápio público responde 403. O stream SSE continua aceito para que os
  cardápios abertos voltem sozinhos na reativação. Slug e QR Code não mudam.
- **Módulos liberáveis**: `restaurant_features` (sem linha = liberado). `requireFeature` protege as
  rotas de personalização e QR Code; o cardápio público devolve `features` e, sem personalização,
  usa o visual padrão. Mudanças publicam `menu.updated`, então os cardápios abertos reagem na hora.
- **Cobrança manual (DEC-011)**: mensalidades geradas sob demanda (idempotente por
  `(restaurant_id, reference_month)`), com valor copiado da assinatura. Pagamento é um registro
  (forma, data, autor); estorno e cancelamento exigem motivo e preservam o registro. "A vencer" e
  "vencida" são calculadas no fuso do negócio (`APP_TIMEZONE`). A visão geral separa valores em
  aberto de pagamentos registrados. Não há gateway de pagamento.
- **Responsáveis**: edição, bloqueio/liberação (encerra sessões) e redefinição de senha, tudo no
  histórico.
- **Primeiro operador**: `npm run platform:create-admin -w backend` (senha via variável de
  ambiente; atualizar a senha de um operador existente encerra as sessões dele).

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
- `retry: 3000` orienta a reconexão automática do navegador; se a conexão for recusada ou
  encerrada de vez, o hook `useMenuEvents` reabre com recuo progressivo (5, 10, 20, 40 e depois a
  cada 60 s), zerado quando a conexão é aceita. Eventos em rajada (~300 ms) viram uma só recarga.
- Restaurante suspenso aceita o stream mesmo com a atualização automática desligada (antes o
  cardápio suspenso tentava reconectar sem fim). Se o cliente desiste durante a abertura do stream,
  a assinatura é desfeita antes de qualquer escrita (sem ouvinte nem heartbeat órfãos).
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
  `utils`. O backoffice fica em `features/platform/{auth,restaurants,billing,audit,overview}`.
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
  deixar de estar disponível com o modal aberto, ele fecha. Não há pedido (DEC-008): sem
  quantidade, observações nem "Adicionar".
- Ordenação na retaguarda por botões ↑/↓ acessíveis (sem biblioteca de arrastar e soltar).

### Áreas administrativas e isolamento do cardápio público

- **Design system administrativo** em `src/components/admin/` (botões, campos, alertas, badges,
  diálogos e gaveta com `<dialog>` nativo, avisos, abas, tabela responsiva, paginação, indicadores,
  ícones SVG próprios) e `layouts/AdminShell.jsx` (barra lateral escura no desktop, gaveta no
  celular, link "Ir para o conteúdo", foco no título a cada navegação). Retaguarda e backoffice
  usam o mesmo shell com navegação própria.
- **Tokens** num segundo bloco `@theme` de `src/styles/index.css`, todos com prefixo `admin`
  (`--color-admin-*`, `--font-admin*`, `--radius-admin-*`, `--shadow-admin-*`); o bloco do cardápio
  e o `@layer base` não mudaram. Uma única entrada Tailwind (dividir o CSS arriscaria a ordem da
  cascata): o CSS público cresceu com as classes administrativas (medido e relatado), o JS público
  não.
- **Fronteira verificada pelo ESLint** (`no-restricted-imports`): cardápio público, `components/ui`,
  `components/shared`, `router.jsx`, `main.jsx` e utilitários públicos não podem importar
  `components/admin`, os layouts administrativos nem `features/platform`.
- **Folha de impressão do QR Code** (`/admin/qrcode/impressao`): fora do shell, A4 com medidas em
  `cqw` (prévia e impressão com a mesma composição) e `@page { margin: 0 }` só enquanto a página
  está aberta.
- **Verificação visual do cardápio**: a cada etapa, capturas renderizadas (Chrome headless via
  DevTools Protocol) de 84 cenários do cardápio — dois restaurantes, três tamanhos de tela, rolagem,
  busca, favoritos, modal, carregando, erro, suspenso e 404 — comparadas pixel a pixel e por estilos
  computados com a referência anterior às mudanças. As ferramentas ficam fora do repositório.

## Decisões de versão

- **Prisma 6** em vez de 7: o gerador do Prisma 7 emite código TypeScript e exige driver adapters;
  o projeto é JavaScript puro nesta versão. A migração para o 7 pode ser feita depois sem mudar o schema.
- **Express 5**: erros em handlers `async` chegam ao middleware de erro sem wrappers.
- **ESLint 10** sem `eslint-plugin-react`: o ESLint 10 já reconhece o uso de componentes em JSX
  e o plugin ainda não suporta essa versão. As regras de hooks vêm de `eslint-plugin-react-hooks`.
- **Override de `deepmerge-ts` 8**: corrige o alerta de segurança GHSA-ggr8-5vv4-36mx herdado da
  CLI do Prisma 6 (ferramenta de desenvolvimento) sem trocar de versão major.
