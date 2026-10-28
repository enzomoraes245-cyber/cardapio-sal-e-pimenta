# API REST — v1

Base: `/api/v1`. Respostas JSON:

- Sucesso: `{ "data": ... }`
- Erro: `{ "error": { "code": "...", "message": "...", "details": [...] } }`

| Código HTTP | `error.code`                       | Quando                                  |
| ----------- | ---------------------------------- | --------------------------------------- |
| 400         | `VALIDATION_ERROR`, `INVALID_JSON` | Parâmetros ou corpo inválidos           |
| 401         | `UNAUTHORIZED`                     | Rota administrativa sem sessão válida   |
| 404         | `NOT_FOUND`, `ROUTE_NOT_FOUND`     | Recurso ou rota inexistente             |
| 413         | `PAYLOAD_TOO_LARGE`                | Corpo acima de 100 kB                   |
| 500         | `INTERNAL_ERROR`                   | Erro inesperado (sem detalhes internos) |

## Endpoints disponíveis

### `GET /health`

Verifica API e PostgreSQL. `200` se o banco responde, `503` caso contrário.

```json
{ "data": { "status": "ok", "database": "up", "timestamp": "2026-10-28T12:00:00.000Z" } }
```

### `GET /public/restaurants/:slug/menu`

Cardápio público. Apenas campos publicáveis e produtos com `is_available = true`, ordenados por
`position`. Sem autenticação.

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
    "categories": [
      {
        "id": "uuid",
        "name": "Entradas",
        "products": [
          {
            "id": "uuid",
            "name": "Bruschetta de tomate",
            "description": "...",
            "price": "24.90",
            "imageUrl": null
          }
        ]
      }
    ]
  }
}
```

### `GET /public/restaurants/:slug/events`

Stream `text/event-stream` com as atualizações do restaurante.

| Evento         | Dados              | Significado                                |
| -------------- | ------------------ | ------------------------------------------ |
| `ready`        | `{ "at": "..." }`  | Conexão (re)estabelecida                   |
| `menu.updated` | `{ "type", "at" }` | O cardápio mudou: buscar `/menu` novamente |

Slug inexistente retorna `404` em JSON antes de abrir o stream.

### `/admin/*`

Todas as rotas exigem sessão administrativa. Sem cookie válido: `401 UNAUTHORIZED`.
O restaurante é sempre o da sessão.

## Endpoints previstos (próximas etapas)

| Prefixo                | Finalidade                          |
| ---------------------- | ----------------------------------- |
| `/auth`                | Login, logout e sessão atual        |
| `/admin/categories`    | Categorias e ordenação              |
| `/admin/products`      | Produtos, preços, fotos e ordenação |
| `/admin/availability`  | Disponibilidade de produtos         |
| `/admin/customization` | Logotipo e cores                    |
| `/admin/qrcode`        | QR Code da URL pública              |
