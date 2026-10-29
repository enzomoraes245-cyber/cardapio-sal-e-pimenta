# Banco de dados

PostgreSQL 17, acessado exclusivamente pelo Prisma (`backend/prisma/schema.prisma`).
Migrations versionadas em `backend/prisma/migrations`:

| Migration                            | Conteúdo                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| `20261028000000_init`                | Restaurantes, administradores, sessões, categorias, produtos, personalização |
| `20261029000000_mvp_modules`         | Descrição curta/detalhada e situação ativo/inativo dos produtos              |
| `20261029010000_platform_backoffice` | Status do restaurante, módulos, assinatura, faturas e operadores (DEC-006)   |

## Modelo

```text
platform_admins 1───* platform_sessions          (backoffice, sem vínculo com restaurante)

restaurants 1───* admin_users 1───* admin_sessions
     │
     ├──1───1 restaurant_customizations
     ├──1───* restaurant_features
     ├──1───1 subscriptions
     ├──1───* invoices
     ├──1───* categories
     │            │ (id, restaurant_id)
     └──1───* products ─┘  FK composta: produto e categoria no mesmo restaurante
```

| Tabela                      | Observações                                                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `restaurants`               | `slug` único e imutável (URL pública e QR Code); `status` `ACTIVE`/`SUSPENDED`, `suspended_at`, `suspension_reason`                                     |
| `admin_users`               | `email` único globalmente; `password_hash` (scrypt)                                                                                                     |
| `admin_sessions`            | `token_hash` (SHA-256) único, `expires_at`; apagada em cascata com o usuário                                                                            |
| `categories`                | `position` para ordenação; unique `(id, restaurant_id)` como alvo da FK composta                                                                        |
| `products`                  | `price NUMERIC(10,2)` com `CHECK (price >= 0)`; `short_description`, `detailed_description`, `image_key`, `is_active`, `is_available`, `position`       |
| `restaurant_customizations` | PK = `restaurant_id` (1:1); `logo_key`, `primary_color`, `secondary_color` (`CHECK` #RRGGBB)                                                            |
| `restaurant_features`       | PK `(restaurant_id, feature)`; `feature` ∈ `CUSTOMIZATION`, `QRCODE`, `REALTIME`, `PRODUCT_MODAL`. Sem linha = liberado                                 |
| `subscriptions`             | PK = `restaurant_id`; `monthly_amount NUMERIC(10,2)`, `due_day` (`CHECK` 1–28), `started_at`                                                            |
| `invoices`                  | Unique `(restaurant_id, reference_month)`; `amount`, `due_date`, `status` `OPEN`/`PAID`/`CANCELED`, `paid_at`. `reference_month` sempre dia 1 (`CHECK`) |
| `platform_admins`           | Operadores do backoffice; `email` único; `password_hash` (scrypt)                                                                                       |
| `platform_sessions`         | Como `admin_sessions`, para o backoffice                                                                                                                |

## Regras garantidas pelo banco

- Produto e categoria sempre do mesmo restaurante (FK composta, RN-003).
- Preço, mensalidade e valor de fatura não negativos; cores no formato `#RRGGBB`; vencimento entre 1 e 28.
- Uma única fatura por restaurante e mês (geração idempotente).

O banco aceita `image_key` nulo somente por compatibilidade com dados antigos. A aplicação exige a
foto no cadastro, e o cardápio público ignora produtos sem foto (RN-004).

## Convenções

- Chaves primárias UUID geradas pela aplicação.
- Tabelas e colunas em `snake_case` (`@map`/`@@map`); modelos Prisma em PascalCase/camelCase.
- `created_at` / `updated_at` (`timestamptz`) em todas as entidades de negócio.
- Valores monetários sempre `NUMERIC`, nunca ponto flutuante. A API devolve valores como string (`"12.50"`).
- Imagens nunca ficam no banco: apenas a chave do arquivo no armazenamento.
- Datas sem horário (`DATE`): vencimento, mês de referência e início da assinatura.

## Índices

| Índice                                                                | Uso                                           |
| --------------------------------------------------------------------- | --------------------------------------------- |
| `restaurants(slug)` único                                             | Resolução do cardápio público e do SSE        |
| `restaurants(status)`                                                 | Listagens do backoffice                       |
| `admin_sessions(token_hash)` / `platform_sessions(token_hash)` únicos | Validação da sessão a cada requisição         |
| `categories(restaurant_id, position)`                                 | Listagem ordenada por restaurante             |
| `products(category_id, restaurant_id, position)`                      | FK composta e listagem ordenada por categoria |
| `products(restaurant_id, is_active, is_available)`                    | Cardápio público (somente publicáveis)        |
| `invoices(status, due_date)`                                          | Faturas em aberto e vencidas                  |

## Exclusões

A especificação não prevê excluir restaurantes, categorias ou produtos. As FKs de negócio usam
`RESTRICT`; para tirar um produto do cardápio, use a situação "inativo". Módulos, assinatura e
faturas são removidos em cascata se um restaurante for apagado diretamente no banco.

## Comandos

```bash
npm run db:migrate           # cria/aplica migrations em desenvolvimento (interativo)
npm run db:deploy -w backend # aplica migrations em produção
npm run db:seed              # restaurante "demo", admin e operador do backoffice
npm run db:studio -w backend # Prisma Studio
```
