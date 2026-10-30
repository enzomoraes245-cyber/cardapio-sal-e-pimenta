# Banco de dados

PostgreSQL (desenvolvido e testado localmente com a versão 18; o `docker-compose.yml` usa a 17),
acessado exclusivamente pelo Prisma (`backend/prisma/schema.prisma`).
Migrations versionadas em `backend/prisma/migrations`:

| Migration                                                | Conteúdo                                                                                      |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `20261028000000_init`                                    | Restaurantes, administradores, sessões, categorias, produtos, personalização                  |
| `20261029000000_mvp_modules`                             | Descrição curta/detalhada e situação ativo/inativo dos produtos                               |
| `20261029010000_platform_backoffice`                     | Status do restaurante, módulos, assinatura, faturas e operadores (DEC-006)                    |
| `20261030020000_acesso_e_auditoria`                      | Bloqueio de responsável, tokens de redefinição de senha e histórico de ações (`audit_events`) |
| `20261030030000_estabelecimento_categorias_idempotencia` | Contato do estabelecimento, categoria oculta e chaves de idempotência                         |
| `20261030040000_pagamentos`                              | Pagamentos com estorno, cancelamento com motivo e histórico financeiro preservado (DEC-011)   |

As três últimas são aditivas. A de pagamentos também migra os dados existentes: cada fatura já
paga recebe um pagamento com o valor da fatura e a data da baixa (forma e autor em branco, pois não
eram registrados) e cada fatura cancelada recebe a data do cancelamento. Nada é apagado.

## Modelo

```text
platform_admins 1───* platform_sessions          (backoffice, sem vínculo com restaurante)
password_reset_tokens  ─── admin_users ou platform_admins (exatamente um)
idempotency_keys                                  (cadastros repetidos; removidas após 24 h)

restaurants 1───* admin_users 1───* admin_sessions
     │
     ├──1───1 restaurant_customizations
     ├──1───* restaurant_features
     ├──1───1 subscriptions
     ├──1───* invoices 1───* payments ─┐  FK composta: pagamento e fatura do mesmo restaurante
     ├──1───* payments ────────────────┘
     ├──1───* audit_events               (histórico; eventos globais sem restaurante)
     ├──1───* categories
     │            │ (id, restaurant_id)
     └──1───* products ─┘  FK composta: produto e categoria no mesmo restaurante
```

| Tabela                      | Observações                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `restaurants`               | `slug` único e imutável (URL pública e QR Code); `status` `ACTIVE`/`SUSPENDED`, `suspended_at`, `suspension_reason`; `contact_phone`, `contact_email` (uso interno) |
| `admin_users`               | `email` único globalmente; `password_hash` (scrypt); `disabled_at` = acesso bloqueado                                                                               |
| `admin_sessions`            | `token_hash` (SHA-256) único, `expires_at`; apagada em cascata com o usuário                                                                                        |
| `password_reset_tokens`     | Só o hash do token; `expires_at`, `used_at` (uso único); dono restaurante **ou** operador (`CHECK`)                                                                 |
| `categories`                | `position` para ordenação; `is_active` (oculta = fora do cardápio); unique `(id, restaurant_id)` como alvo da FK composta                                           |
| `products`                  | `price NUMERIC(10,2)` com `CHECK (price >= 0)`; `short_description`, `detailed_description`, `image_key`, `is_active`, `is_available`, `position`                   |
| `restaurant_customizations` | PK = `restaurant_id` (1:1); `logo_key`, `primary_color`, `secondary_color` (`CHECK` #RRGGBB)                                                                        |
| `restaurant_features`       | PK `(restaurant_id, feature)`; `feature` ∈ `CUSTOMIZATION`, `QRCODE`, `REALTIME`, `PRODUCT_MODAL`. Sem linha = liberado                                             |
| `subscriptions`             | PK = `restaurant_id`; `monthly_amount NUMERIC(10,2)`, `due_day` (`CHECK` 1–28), `started_at`                                                                        |
| `invoices`                  | Unique `(restaurant_id, reference_month)`; `amount` copiado da assinatura; `due_date`; `status` `OPEN`/`PAID`/`CANCELED`; `paid_at`; `canceled_at/by/cancel_reason` |
| `payments`                  | `amount`, `paid_on` (DATE), `method`, `notes`, autor do registro; estorno em `voided_at/by/void_reason`; `active_invoice_id` único (ver abaixo)                     |
| `audit_events`              | `occurred_at`, autor (`actor_type`, `actor_id`, `actor_name`), `restaurant_id`, `action`, entidade, `reason`, `metadata` (JSON com antes/depois e valores)          |
| `idempotency_keys`          | PK `(scope, owner_id, key)`, `resource_id`; limpeza oportunista após 24 h                                                                                           |
| `platform_admins`           | Operadores do backoffice; `email` único; `password_hash` (scrypt)                                                                                                   |
| `platform_sessions`         | Como `admin_sessions`, para o backoffice                                                                                                                            |

## Regras garantidas pelo banco

- Produto e categoria sempre do mesmo restaurante (FK composta, RN-003); o mesmo vale para
  pagamento e fatura.
- Preço, mensalidade, valor de fatura e de pagamento não negativos; cores no formato `#RRGGBB`;
  vencimento entre 1 e 28; e-mail de contato em minúsculas.
- Uma única fatura por restaurante e mês (geração idempotente).
- **No máximo um pagamento válido por fatura**: `active_invoice_id` é igual a `invoice_id` enquanto
  o pagamento vale e `NULL` depois do estorno, com índice único (o Prisma não representa índice
  parcial). Um `CHECK` exige data e motivo em todo estorno.
- Só a fatura cancelada tem data de cancelamento (`CHECK`).
- Token de redefinição pertence a exatamente um dono (`CHECK`).

O banco aceita `image_key` nulo: a foto é opcional no cadastro (DEC-007) e o cardápio público só
mostra produtos com foto.

## Convenções

- Chaves primárias UUID geradas pela aplicação.
- Tabelas e colunas em `snake_case` (`@map`/`@@map`); modelos Prisma em PascalCase/camelCase.
- `created_at` / `updated_at` (`timestamptz`) em todas as entidades de negócio.
- Valores monetários sempre `NUMERIC`, nunca ponto flutuante. A API devolve valores como string (`"12.50"`).
- Imagens nunca ficam no banco: apenas a chave do arquivo no armazenamento.
- Datas sem horário (`DATE`): vencimento, mês de referência, início da assinatura e data do
  pagamento. "Hoje" é calculado no fuso do negócio (`APP_TIMEZONE`).
- Autor nas tabelas de histórico (`audit_events`, `payments`, `invoices`) guardado como id + nome
  da época, sem FK: o histórico continua legível mesmo se a pessoa mudar de nome.

## Índices

| Índice                                                                   | Uso                                           |
| ------------------------------------------------------------------------ | --------------------------------------------- |
| `restaurants(slug)` único                                                | Resolução do cardápio público e do SSE        |
| `restaurants(status)`                                                    | Listagens do backoffice                       |
| `admin_sessions(token_hash)` / `platform_sessions(token_hash)` únicos    | Validação da sessão a cada requisição         |
| `categories(restaurant_id, position)`                                    | Listagem ordenada por restaurante             |
| `products(category_id, restaurant_id, position)`                         | FK composta e listagem ordenada por categoria |
| `products(restaurant_id, is_active, is_available)`                       | Cardápio público (somente publicáveis)        |
| `invoices(status, due_date)`                                             | Mensalidades em aberto, a vencer e vencidas   |
| `payments(active_invoice_id)` único                                      | Um pagamento válido por fatura                |
| `payments(paid_on)` / `payments(restaurant_id, paid_on)`                 | Pagamentos por período                        |
| `audit_events(restaurant_id, occurred_at)` / `audit_events(occurred_at)` | Histórico do restaurante e da plataforma      |

## Exclusões

Não há exclusão de restaurantes, categorias, produtos, mensalidades ou pagamentos pela aplicação.
As FKs de negócio usam `RESTRICT`: um restaurante com faturas, pagamentos ou histórico não pode ser
apagado nem diretamente no banco. Para tirar um produto do cardápio, use a situação "inativo";
uma categoria, "oculta". Módulos e assinatura ainda são removidos em cascata.

## Comandos

```bash
npm run db:migrate           # cria/aplica migrations em desenvolvimento (interativo)
npm run db:deploy -w backend # aplica migrations (produção e banco de testes)
npm run db:seed              # recria os restaurantes de demonstração, admin e operador (não roda em produção)
npm run db:studio -w backend # Prisma Studio
```

O seed **recria o cardápio** dos restaurantes de demonstração e redefine as senhas dessas contas
(encerrando as sessões delas); não o execute em um banco com dados reais desses restaurantes.
