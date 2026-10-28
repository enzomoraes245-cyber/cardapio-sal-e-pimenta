# Banco de dados

PostgreSQL 17, acessado exclusivamente pelo Prisma (`backend/prisma/schema.prisma`).
Migrations versionadas em `backend/prisma/migrations`.

## Modelo

```text
restaurants 1───* admin_users 1───* admin_sessions
     │
     ├──1───1 restaurant_customizations
     ├──1───* categories
     │            │ (id, restaurant_id)
     └──1───* products ─┘  FK composta: produto e categoria no mesmo restaurante
```

| Tabela                      | Observações                                                                             |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `restaurants`               | `slug` único e estável (URL pública e QR Code)                                          |
| `admin_users`               | `email` único globalmente; `password_hash` (scrypt)                                     |
| `admin_sessions`            | `token_hash` (SHA-256) único, `expires_at`; apagada em cascata com o usuário            |
| `categories`                | `position` para ordenação; unique `(id, restaurant_id)` como alvo da FK composta        |
| `products`                  | `price NUMERIC(10,2)` com `CHECK (price >= 0)`; `image_key`; `is_available`; `position` |
| `restaurant_customizations` | PK = `restaurant_id` (1:1); `logo_key`, `primary_color`, `secondary_color`              |

## Convenções

- Chaves primárias UUID geradas pela aplicação.
- Tabelas e colunas em `snake_case` (`@map`/`@@map`); modelos Prisma em PascalCase/camelCase.
- `created_at` / `updated_at` (`timestamptz`) em todas as entidades de negócio.
- Valores monetários sempre `NUMERIC`, nunca ponto flutuante. A API devolve preço como string (`"12.50"`).
- Imagens nunca ficam no banco: apenas a chave do arquivo no armazenamento.

## Índices

| Índice                                  | Uso                                    |
| --------------------------------------- | -------------------------------------- |
| `restaurants(slug)` único               | Resolução do cardápio público e do SSE |
| `admin_sessions(token_hash)` único      | Validação da sessão a cada requisição  |
| `admin_sessions(expires_at)`            | Limpeza de sessões expiradas           |
| `categories(restaurant_id, position)`   | Listagem ordenada por restaurante      |
| `products(category_id, restaurant_id)`  | FK composta e listagem por categoria   |
| `products(restaurant_id, is_available)` | Cardápio público (somente disponíveis) |
| `admin_users(restaurant_id)`            | Usuários de um restaurante             |

## Exclusões

As FKs de negócio usam o padrão `RESTRICT`: não é possível apagar um restaurante com categorias
ou produtos, nem uma categoria com produtos. O comportamento desejado ao excluir categorias com
produtos ainda precisa ser definido (ver [requisitos](../requirements/README.md)).

## Comandos

```bash
npm run db:migrate           # cria/aplica migrations em desenvolvimento
npm run db:deploy -w backend # aplica migrations em produção
npm run db:seed              # restaurante de demonstração "demo"
npm run db:studio -w backend # Prisma Studio
```
