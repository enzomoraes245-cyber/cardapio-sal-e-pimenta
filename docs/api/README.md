# API REST — v1

Base: `/api/v1`. Respostas JSON:

- Sucesso: `{ "data": ... }`
- Erro: `{ "error": { "code": "...", "message": "...", "details": [{ "source", "path", "message" }] } }`

| Código HTTP | `error.code`                                               | Quando                                                               |
| ----------- | ---------------------------------------------------------- | -------------------------------------------------------------------- |
| 400         | `VALIDATION_ERROR`, `INVALID_JSON`, `INVALID_IMAGE`        | Dados inválidos ou arquivo que não é JPEG/PNG/WebP                   |
| 400         | `MALFORMED_MULTIPART`                                      | Corpo multipart incompleto ou malformado                             |
| 400         | `INVALID_RESET_TOKEN`                                      | Link de redefinição de senha inválido, usado ou expirado             |
| 401         | `UNAUTHORIZED`, `INVALID_CREDENTIALS`                      | Sem sessão válida ou login incorreto                                 |
| 403         | `RESTAURANT_SUSPENDED`                                     | Restaurante suspenso pelo backoffice                                 |
| 403         | `USER_DISABLED`                                            | Acesso do responsável bloqueado pela plataforma                      |
| 403         | `FEATURE_DISABLED`                                         | Módulo não liberado para o restaurante                               |
| 403         | `FORBIDDEN_ORIGIN`                                         | Escrita com cabeçalho `Origin` diferente do frontend                 |
| 404         | `NOT_FOUND`, `ROUTE_NOT_FOUND`                             | Inexistente — inclusive dado de **outro restaurante**                |
| 409         | `SLUG_TAKEN`, `EMAIL_TAKEN`                                | Slug ou e-mail já cadastrados                                        |
| 409         | `INVALID_STATUS`                                           | Restaurante ou responsável já está na situação pedida                |
| 409         | `INVOICE_ALREADY_PAID`, `INVOICE_CANCELED`, `INVOICE_PAID` | Pagamento repetido, mensalidade cancelada, cancelar paga sem estorno |
| 409         | `INVOICE_ALREADY_CANCELED`, `INVOICE_NOT_CANCELED`         | Cancelar de novo, reabrir mensalidade que não está cancelada         |
| 409         | `PAYMENT_ALREADY_VOIDED`, `INVOICE_STATE_CHANGED`          | Estorno repetido; situação mudou durante a operação                  |
| 409         | `REQUEST_IN_PROGRESS`                                      | Mesma `Idempotency-Key` ainda em processamento                       |
| 413         | `PAYLOAD_TOO_LARGE`                                        | JSON acima de 100 kB ou imagem acima de 5 MB                         |
| 429         | `TOO_MANY_ATTEMPTS`                                        | Limite de tentativas de login ou de recuperação de senha             |
| 503         | `MAIL_DISABLED`                                            | Envio de e-mail desligado (provedor não configurado)                 |
| 500         | `INTERNAL_ERROR`                                           | Erro inesperado (sem detalhes internos)                              |

Escritas (POST/PUT/PATCH/DELETE) com cabeçalho `Origin` só são aceitas vindas de `APP_PUBLIC_URL`.

**Envios repetidos** — os cadastros de restaurante, categoria, produto e pagamento aceitam o
cabeçalho `Idempotency-Key` (8 a 100 caracteres `A-Z a-z 0-9 _ -`). A primeira requisição responde
`201`; as seguintes com a mesma chave (por 24 h) devolvem o registro já criado com `200`.

**Datas** — `"AAAA-MM-DD"` para datas e `"AAAA-MM"` para competências. "Hoje" segue
`APP_TIMEZONE` (padrão `America/Sao_Paulo`). Valores monetários são strings com 2 casas (`"89.90"`).

## Público (sem autenticação)

| Método e rota                          | Descrição                                          |
| -------------------------------------- | -------------------------------------------------- |
| `GET /health`                          | API e PostgreSQL. `200` (banco ok) ou `503`        |
| `GET /public/restaurants/:slug/menu`   | Cardápio publicado (MOD-06)                        |
| `GET /public/restaurants/:slug/events` | Stream SSE de atualizações do restaurante (MOD-08) |

**Cardápio** — somente produtos ativos, disponíveis, com foto e de categorias visíveis, ordenados
pela retaguarda; categorias sem produtos visíveis não aparecem. Restaurante suspenso:
`403 RESTAURANT_SUSPENDED`.

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
Telefone e e-mail de contato do estabelecimento nunca fazem parte do cardápio.

**Eventos SSE**

| Evento         | Dados              | Significado                                           |
| -------------- | ------------------ | ----------------------------------------------------- |
| `ready`        | `{ "at": "..." }`  | Conexão (re)estabelecida: recarregar se for reconexão |
| `menu.updated` | `{ "type", "at" }` | O cardápio mudou: buscar `/menu` novamente            |
| `ping`         | `{}`               | Heartbeat a cada 20 s                                 |

Slug inexistente: `404`. Restaurante ativo com o módulo de atualização automática desligado:
`403 FEATURE_DISABLED`. Restaurante **suspenso** aceita a conexão mesmo com o módulo desligado, para
os cardápios abertos voltarem sozinhos na reativação. Se o cliente desiste durante a abertura, a
assinatura é desfeita (sem ouvinte nem heartbeat órfãos).

## Retaguarda do restaurante

Autenticação por cookie HttpOnly `cd_session`. Todas as rotas `/admin/*` operam **somente** sobre o
restaurante da sessão; um id de outro restaurante responde `404` (CA-003).

| Método e rota                                                     | Descrição                                                                                                                                                              |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /auth/login` `{ email, password }`                          | Abre sessão (MOD-01). Responsável bloqueado: `403 USER_DISABLED` (depois de conferir a senha)                                                                          |
| `POST /auth/logout`                                               | Encerra a sessão                                                                                                                                                       |
| `GET /auth/me`                                                    | `{ admin, restaurant, features }`                                                                                                                                      |
| `PUT /auth/password` `{ currentPassword, newPassword }`           | Troca a própria senha; encerra as outras sessões                                                                                                                       |
| `GET /auth/password/recovery`                                     | `{ emailRecovery, developmentMailLog, linkTtlMinutes }` — se a recuperação por e-mail está disponível                                                                  |
| `POST /auth/password/forgot` `{ email }`                          | `202` sempre (não revela se o e-mail existe); envia o link quando houver conta ativa                                                                                   |
| `POST /auth/password/reset` `{ token, password }`                 | Redefine pelo link (uso único) e encerra todas as sessões                                                                                                              |
| `GET /admin/establishment`                                        | `{ name, slug, contactPhone, contactEmail, publicUrl }`                                                                                                                |
| `PUT /admin/establishment` `{ name, contactPhone, contactEmail }` | Nome exibido e contato interno (sempre liberado). Mudar o nome avisa os cardápios abertos                                                                              |
| `GET /admin/categories`                                           | Categorias em ordem, com `isActive`, `productCount` e `publishableCount`                                                                                               |
| `POST /admin/categories` `{ name }`                               | Cadastra no fim da lista (MOD-02); aceita `Idempotency-Key`                                                                                                            |
| `PATCH /admin/categories/:id` `{ name }`                          | Renomeia                                                                                                                                                               |
| `PATCH /admin/categories/:id/status` `{ isActive }`               | Oculta ou mostra a categoria (e seus produtos) no cardápio, sem apagar nada                                                                                            |
| `PUT /admin/categories/order` `{ ids }`                           | Nova ordem — exige todas as categorias, sem repetição                                                                                                                  |
| `GET /admin/products` · `GET /admin/products/:id`                 | Produtos ordenados por categoria e posição, com a categoria (`id`, `name`, `isActive`)                                                                                 |
| `POST /admin/products` (multipart)                                | `name`, `price`, `categoryId` obrigatórios; `image`, `shortDescription`, `detailedDescription`, `isActive`, `isAvailable` opcionais (MOD-03); aceita `Idempotency-Key` |
| `PATCH /admin/products/:id`                                       | Altera nome, descrições, preço e categoria                                                                                                                             |
| `PUT /admin/products/:id/image` (multipart `image`)               | Envia ou substitui a foto                                                                                                                                              |
| `DELETE /admin/products/:id/image`                                | Remove a foto (o produto sai do cardápio até receber outra)                                                                                                            |
| `PATCH /admin/products/:id/status` `{ isActive?, isAvailable? }`  | Situação (MOD-04)                                                                                                                                                      |
| `PUT /admin/categories/:id/products/order` `{ ids }`              | Ordem dos produtos na categoria (MOD-05)                                                                                                                               |
| `GET /admin/customization`                                        | Logotipo e cores ¹                                                                                                                                                     |
| `PATCH /admin/customization` `{ primaryColor?, secondaryColor? }` | Cores do cardápio ¹ (MOD-10)                                                                                                                                           |
| `PUT /admin/customization/logo` (multipart `logo`)                | Envia ou substitui o logotipo ¹                                                                                                                                        |
| `DELETE /admin/customization/logo`                                | Remove o logotipo ¹                                                                                                                                                    |
| `GET /admin/qrcode`                                               | `{ slug, url, restaurantName, logoUrl, addressKind }` ² (MOD-09); `addressKind`: `public`, `local` ou `private-network`                                                |
| `GET /admin/qrcode/image.png[?download=1]`                        | PNG 1024 px do QR Code ²                                                                                                                                               |
| `GET /admin/qrcode/image.svg[?download=1]`                        | O mesmo QR Code em SVG (impressão) ²                                                                                                                                   |

¹ Exige o módulo Personalização. ² Exige o módulo QR Code. Sem o módulo: `403 FEATURE_DISABLED`.
`?download` só baixa como anexo com `1` ou `true`.

Preço: maior que zero, até 2 casas (`"12,50"`, `"12.50"` ou `12.5`); devolvido como string `"12.50"`.
Imagens: JPEG, PNG ou WebP até 5 MB, validadas pelo conteúdo; a foto/logotipo anterior só é apagada
depois que a troca é gravada. Toda alteração que muda o cardápio publica `menu.updated`.

## Backoffice da plataforma (DEC-006, DEC-011)

Autenticação por cookie HttpOnly `cd_platform_session`, independente da retaguarda. A sessão de um
administrador de restaurante não dá acesso a `/platform/*`. Toda alteração fica no histórico com o
operador, a data e o motivo (quando exigido).

**Sessão e conta** — `POST /platform/auth/login`, `POST /platform/auth/logout`,
`GET /platform/auth/me`, `PUT /platform/auth/password` e as mesmas rotas de recuperação de senha
em `/platform/auth/password/*`.

**Restaurantes e responsáveis**

| Método e rota                                                            | Descrição                                                                                                                                                                 |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /platform/restaurants`                                              | Situação, contato, responsável principal, assinatura, módulos, `overdueInvoices` e `overdueAmount`                                                                        |
| `POST /platform/restaurants`                                             | `{ slug, name, contactPhone?, contactEmail?, admin: { name, email, password }, subscription: { monthlyAmount, dueDay, startedAt? }, features }`; aceita `Idempotency-Key` |
| `GET /platform/restaurants/:id`                                          | Detalhe, com responsáveis                                                                                                                                                 |
| `PATCH /platform/restaurants/:id` `{ name, contactPhone, contactEmail }` | Dados cadastrais (o slug é fixo)                                                                                                                                          |
| `POST /platform/restaurants/:id/suspend` `{ reason }`                    | Suspende retaguarda e cardápio (só a partir de ativo)                                                                                                                     |
| `POST /platform/restaurants/:id/reactivate` `{ reason }`                 | Reativa (só a partir de suspenso)                                                                                                                                         |
| `PUT /platform/restaurants/:id/features`                                 | `{ customization, qrcode, realtime, productModal }`                                                                                                                       |
| `POST /platform/restaurants/:id/admins`                                  | Novo responsável `{ name, email, password }`                                                                                                                              |
| `PATCH /platform/restaurants/:id/admins/:adminId` `{ name?, email? }`    | Altera nome ou e-mail do responsável                                                                                                                                      |
| `POST /platform/restaurants/:id/admins/:adminId/block` `{ reason? }`     | Bloqueia o acesso e encerra as sessões                                                                                                                                    |
| `POST /platform/restaurants/:id/admins/:adminId/unblock` `{ reason? }`   | Libera o acesso                                                                                                                                                           |
| `PUT /platform/restaurants/:id/admins/:adminId/password`                 | Redefine a senha e encerra as sessões dele                                                                                                                                |
| `GET /platform/audit-events?restaurantId=&page=&pageSize=`               | Histórico `{ items, total, page, pageSize }`, do mais recente; sem `restaurantId`, de toda a plataforma                                                                   |

**Assinaturas, mensalidades e pagamentos**

| Método e rota                                                                        | Descrição                                                                                                                                   |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUT /platform/restaurants/:id/subscription` `{ monthlyAmount, dueDay, startedAt? }` | Assinatura (dia 1–28). Vale para as próximas mensalidades; as geradas mantêm o valor                                                        |
| `GET /platform/invoices?restaurantId=&situation=&from=&to=&page=&pageSize=`          | `{ items, total, page, pageSize, sum }`; `situation`: `open`, `upcoming`, `overdue`, `paid`, `canceled`; `from`/`to`: competência `AAAA-MM` |
| `POST /platform/invoices/generate` `{ month: "AAAA-MM" }`                            | Gera as mensalidades do mês dos restaurantes ativos; idempotente `{ month, created, billable }`                                             |
| `POST /platform/invoices/:id/payments` `{ paidOn, method, notes? }`                  | Registra o pagamento de mensalidade em aberto (valor = mensalidade; data não futura); aceita `Idempotency-Key`                              |
| `POST /platform/invoices/:id/cancel` `{ reason }`                                    | Cancela mensalidade em aberto                                                                                                               |
| `POST /platform/invoices/:id/reopen` `{ reason }`                                    | Reabre mensalidade cancelada                                                                                                                |
| `GET /platform/payments?restaurantId=&from=&to=&includeVoided=&page=&pageSize=`      | `{ items, total, page, pageSize, validCount, sum }` — `sum` e `validCount` nunca incluem estornados                                         |
| `POST /platform/payments/:id/void` `{ reason }`                                      | Estorna: o registro é mantido e a mensalidade volta a ficar em aberto                                                                       |
| `GET /platform/overview?from=&to=`                                                   | Indicadores (ver abaixo); sem datas, o mês atual                                                                                            |

`method`: `PIX`, `BOLETO`, `TRANSFER`, `CARD`, `CASH` ou `OTHER`. A troca livre de situação
(`PATCH /platform/invoices/:id`) não existe mais: cada mudança tem a própria rota, com motivo.

Mensalidade:

```json
{
  "id": "uuid",
  "restaurant": { "id": "uuid", "name": "Café Aroma", "slug": "cafe-aroma", "status": "ACTIVE" },
  "referenceMonth": "2026-10",
  "amount": "89.90",
  "dueDate": "2026-10-15",
  "status": "PAID",
  "situation": "paid",
  "overdue": false,
  "payment": {
    "id": "uuid",
    "amount": "89.90",
    "paidOn": "2026-10-14",
    "method": "CASH",
    "notes": null,
    "recordedBy": { "name": "Equipe da plataforma" },
    "recordedAt": "2026-10-14T15:02:11.000Z",
    "voided": false,
    "voidedAt": null,
    "voidedBy": null,
    "voidReason": null
  },
  "canceledAt": null,
  "canceledBy": null,
  "cancelReason": null
}
```

Visão geral — critérios explícitos; valores em aberto nunca são somados aos recebidos:

| Campo             | Critério                                                                 |
| ----------------- | ------------------------------------------------------------------------ |
| `restaurants`     | `{ total, active, suspended }`                                           |
| `upcoming`        | Mensalidades em aberto com vencimento hoje ou depois `{ count, amount }` |
| `overdue`         | Em aberto com vencimento antes de hoje `{ count, amount, restaurants }`  |
| `payments`        | Pagamentos não estornados com data no período `{ count, amount }`        |
| `period`, `today` | Período usado (`from`/`to`) e a data de hoje no fuso do negócio          |
