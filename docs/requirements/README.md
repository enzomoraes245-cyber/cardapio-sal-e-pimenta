# Requisitos

- Baseline funcional: [especificacao-funcional-v1.md](especificacao-funcional-v1.md) (MVP v1.0).
- Este documento registra as revisões de escopo e as definições técnicas que a baseline deixou em
  aberto (seção 9). Nenhuma delas cria funcionalidade além das listadas aqui.

## Revisões de escopo

### DEC-006 — Backoffice da plataforma (revisão da seção 8)

A seção 8 da baseline excluía o "painel central de administração comercial de restaurantes" e
"pagamentos". Por decisão do responsável pelo produto, passa a integrar o escopo um **backoffice da
plataforma**, com login exclusivo dos operadores, que permite:

1. Cadastrar restaurantes (slug, nome e primeiro administrador).
2. Controlar a assinatura mensal de cada restaurante, com **cobrança manual**: faturas mensais com
   baixa manual (paga, em aberto, cancelada). **Não há integração com gateway de pagamento**; a
   exclusão de "pagamentos" continua valendo para os clientes finais.
3. Suspender e reativar restaurantes, por exemplo por inadimplência. A suspensão é **manual** e
   bloqueia a retaguarda e o cardápio público, que exibe "temporariamente indisponível". O slug e o
   QR Code não mudam e voltam a funcionar quando o restaurante é reativado.
4. Liberar ou bloquear, por restaurante, os módulos: **Personalização visual, QR Code,
   Atualização automática e Modal de detalhes**. Autenticação, categorias, produtos,
   disponibilidade, ordenação e cardápio público são sempre liberados.

O backoffice é implementado depois dos módulos MOD-01 a MOD-10 (fase 2).

## Definições técnicas (seção 9 e lacunas da baseline)

| Tema                            | Definição                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Fotografia obrigatória (RN-004) | Exigida já no cadastro do produto. Pode ser substituída, nunca removida.                                  |
| Imagens (fotos e logotipo)      | JPEG, PNG ou WebP, até 5 MB. O tipo é validado pelo conteúdo do arquivo, não pela extensão.               |
| Preço válido                    | Maior que zero, com no máximo 2 casas decimais, exibido em reais (pt-BR).                                 |
| Propagação das atualizações     | Tempo real via SSE; meta de até 2 s entre salvar na retaguarda e atualizar o cardápio aberto.             |
| Contas iniciais                 | Restaurantes e administradores são criados pelo backoffice (DEC-006); o primeiro operador por script CLI. |
| URL pública                     | `/cardapio/:slug`. O slug é definido na criação e não pode ser alterado (RN-013, RF-036).                 |
| Login do administrador          | E-mail (único no sistema) e senha. Cada administrador pertence a um único restaurante.                    |
| Exclusões                       | A baseline não prevê excluir categorias ou produtos. Para tirar um produto do cardápio, use "inativo".    |
| Categoria sem produtos visíveis | Não aparece no cardápio público.                                                                          |
| Sessão administrativa           | Cookie HttpOnly com token aleatório (só o hash fica no banco); validade padrão de 12 h.                   |
| Busca (CA-018)                  | Pelo nome do produto, sem diferenciar maiúsculas e acentos.                                               |
| Legibilidade das cores (CA-033) | A cor do texto sobre a cor do restaurante é escolhida automaticamente (branco ou escuro) por contraste.   |

## Pontos em aberto

1. Serviço de armazenamento de imagens em produção (ex.: S3, Cloudflare R2). Hoje: disco local.
2. Política de expiração de sessão por inatividade (hoje: validade fixa).
