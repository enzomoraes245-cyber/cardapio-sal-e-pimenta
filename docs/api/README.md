# API REST — v1

Base: `/api/v1`. Respostas JSON:

- Sucesso: `{ "data": ... }`
- Erro: `{ "error": { "code": "...", "message": "...", "details": [{ "source", "path", "message" }] } }`

| Código HTTP | `error.code`                                        | Quando                                                |
| ----------- | --------------------------------------------------- | ----------------------------------------------------- |
| 400         | `VALIDATION_ERROR`, `INVALID_JSON`, `INVALID_IMAGE` | Dados inválidos ou arquivo que não é JPEG/PNG/WebP    |
| 401         | `UNAUTHORIZED`, `INVALID_CREDENTIALS`               | Sem sessão válida ou login incorreto                  |
| 403         | `RESTAURANT_SUSPENDED`                              | Restaurante suspenso pelo backoffice                  |
| 403         | `FEATURE_DISABLED`                                  | Módulo não liberado para o restaurante                |
| 403         | `FORBIDDEN_ORIGIN`                                  | Escrita com cabeçalho `Origin` diferente do frontend  |
| 404         | `NOT_FOUND`, `ROUTE_NOT_FOUND`                      | Inexistente — inclusive dado de **outro restaurante** |
| 409         | `SLUG_TAKEN`, `EMAIL_TAKEN`                         | Slug ou e-mail já cadastrados                         |
| 413         | `PAYLOAD_TOO_LARGE`                                 | JSON acima de 100 kB ou imagem acima de 5 MB          |
| 429         | `TOO_MANY_ATTEMPTS`                                 | Mais de 10 logins falhos em 15 min (IP + e-mail)      |
| 500         | `INTERNAL_ERROR`                                    | Erro inesperado (sem detalhes internos)               |

Escritas (POST/PUT/PATCH/DELETE) com cabeçalho `Origin` só são aceitas vindas de `APP_PUBLIC_URL`.

## Público (sem autenticação)

| Método e rota                          | Descrição                                          |
| -------------------------------------- | -------------------------------------------------- |
| `GET /health`                          | API e PostgreSQL. `200` (banco ok) ou `503`        |
| `GET /public/restaurants/:slug/menu`   | Cardápio publicado (MOD-06)                        |
| `GET /public/restaurants/:slug/events` | Stream SSE de atualizações do restaurante (MOD-08) |

**Cardápio** — somente produtos ativos, disponíveis e com foto, ordenados pela retaguarda;
categorias sem produtos visíveis não aparecem. Restaurante suspenso: `403 RESTAURANT_SUSPENDED`.

```json
{
  "data": {
    "restaurant": {
      "slug": "demo",
      "name": "Restaurante Demonstração",
      "logoUrl": null,
      "primaryColor": "#9a3412",
      "secondaryColor": "#fef3c7"
    },
    "features": { "realtime": true, "productModal": true },
    "categories": [
      {
        "id": "uuid",
        "name": "Entradas",
        "products": [
          {
            "id": "uuid",
            "name": "Bruschetta de tomate",
            "shortDescription": "Pão italiano, tomate, manjericão e azeite.",
            "detailedDescription": "…",
            "price": "24.90",
            "imageUrl": "/uploads/restaurants/<id>/products/<uuid>.png"
          }
        ]
      }
    ]
  }
}
```

Com o módulo de personalização desligado, `logoUrl` e as cores voltam `null` (visual padrão).

**Eventos SSE**

| Evento         | Dados              | Significado                                           |
| -------------- | ------------------ | ----------------------------------------------------- |
| `ready`        | `{ "at": "..." }`  | Conexão (re)estabelecida: recarregar se for reconexão |
| `menu.updated` | `{ "type", "at" }` | O cardápio mudou: buscar `/menu` novamente            |
| `ping`         | `{}`               | Heartbeat a cada 20 s                                 |

Slug inexistente: `404`. Módulo de atualização automática desligado: `403 FEATURE_DISABLED`.
Restaurante suspenso continua aceitando a conexão, para os cardápios abertos voltarem sozinhos na
reativação.

## Retaguarda do restaurante

Autenticação por cookie HttpOnly `cd_session`. Todas as rotas `/admin/*` operam **somente** sobre o
restaurante da sessão; um id de outro restaurante responde `404` (CA-003).

| Método e rota                                                            | Descrição                                                                                                                                                 |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /auth/login` `{ email, password }`                                 | Abre sessão (MOD-01)                                                                                                                                      |
| `POST /auth/logout`                                                      | Encerra a sessão                                                                                                                                          |
| `GET /auth/me`                                                           | `{ admin, restaurant, features }`                                                                                                                         |
| `GET /admin/categories`                                                  | Categorias em ordem, com `productCount`                                                                                                                   |
| `POST /admin/categories` `{ name }`                                      | Cadastra no fim da lista (MOD-02)                                                                                                                         |
| `PATCH /admin/categories/:id` `{ name }`                                 | Renomeia                                                                                                                                                  |
| `PUT /admin/categories/order` `{ ids }`                                  | Nova ordem — exige todas as categorias, sem repetição                                                                                                     |
| `GET /admin/products`                                                    | Produtos ordenados por categoria e posição                                                                                                                |
| `GET /admin/products/:id`                                                | Detalhe                                                                                                                                                   |
| `POST /admin/products` (multipart)                                       | Cadastro com `name`, `price`, `categoryId`, `image` obrigatórios; `shortDescription`, `detailedDescription`, `isActive`, `isAvailable` opcionais (MOD-03) |
| `PATCH /admin/products/:id`                                              | Altera nome, descrições, preço e categoria                                                                                                                |
| `PUT /admin/products/:id/image` (multipart `image`)                      | Substitui a foto                                                                                                                                          |
| `PATCH /admin/products/:id/status` `{ isActive?, isAvailable? }`         | Situação (MOD-04)                                                                                                                                         |
| `PUT /admin/categories/:id/products/order` `{ ids }`                     | Ordem dos produtos na categoria (MOD-05)                                                                                                                  |
| `GET /admin/customization`                                               | Nome, logotipo e cores ¹                                                                                                                                  |
| `PATCH /admin/customization` `{ name?, primaryColor?, secondaryColor? }` | Altera identidade visual ¹ (MOD-10)                                                                                                                       |
| `PUT /admin/customization/logo` (multipart `logo`)                       | Envia/substitui o logotipo ¹                                                                                                                              |
| `GET /admin/qrcode`                                                      | `{ slug, url }` do cardápio ² (MOD-09)                                                                                                                    |
| `GET /admin/qrcode/image.png[?download=1]`                               | PNG 1024 px do QR Code ²                                                                                                                                  |

¹ Exige o módulo Personalização. ² Exige o módulo QR Code. Sem o módulo: `403 FEATURE_DISABLED`.

Preço: maior que zero, até 2 casas (`"12,50"`, `"12.50"` ou `12.5`); devolvido como string `"12.50"`.
Imagens: JPEG, PNG ou WebP até 5 MB, validadas pelo conteúdo. Toda alteração publica `menu.updated`.

## Backoffice da plataforma (DEC-006)

Autenticação por cookie HttpOnly `cd_platform_session`, independente da retaguarda. A sessão de um
administrador de restaurante não dá acesso a `/platform/*`.

| Método e rota                                                                        | Descrição                                                                                             |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `POST /platform/auth/login` · `POST /platform/auth/logout` · `GET /platform/auth/me` | Sessão do operador                                                                                    |
| `GET /platform/restaurants`                                                          | Restaurantes com situação, assinatura, módulos e `overdueInvoices`                                    |
| `POST /platform/restaurants`                                                         | `{ slug, name, admin: { name, email, password }, subscription: { monthlyAmount, dueDay }, features }` |
| `GET /platform/restaurants/:id`                                                      | Detalhe, com administradores                                                                          |
| `PATCH /platform/restaurants/:id` `{ name }`                                         | Renomeia (o slug é fixo)                                                                              |
| `POST /platform/restaurants/:id/suspend` `{ reason }`                                | Suspende retaguarda e cardápio                                                                        |
| `POST /platform/restaurants/:id/reactivate`                                          | Reativa                                                                                               |
| `PUT /platform/restaurants/:id/features`                                             | `{ customization, qrcode, realtime, productModal }`                                                   |
| `POST /platform/restaurants/:id/admins`                                              | Novo administrador do restaurante                                                                     |
| `PUT /platform/restaurants/:id/admins/:adminId/password`                             | Redefine a senha e encerra as sessões dele                                                            |
| `PUT /platform/restaurants/:id/subscription`                                         | `{ monthlyAmount, dueDay }` (dia 1–28)                                                                |
| `GET /platform/invoices?status=&overdue=&month=&restaurantId=`                       | Faturas (com `overdue` calculado)                                                                     |
| `POST /platform/invoices/generate` `{ month: "AAAA-MM" }`                            | Gera faturas do mês dos restaurantes ativos; idempotente                                              |
| `PATCH /platform/invoices/:id` `{ status }`                                          | Baixa manual: `PAID`, `OPEN` ou `CANCELED`                                                            |
