# Requisitos

A especificação funcional aprovada deve ser mantida nesta pasta. A implementação das próximas
etapas segue essa especificação.

## Decisões tomadas na fundação (a confirmar)

| Tema                               | Decisão provisória                                                      |
| ---------------------------------- | ----------------------------------------------------------------------- |
| URL pública                        | `/cardapio/:slug`, onde `slug` é único e estável por restaurante        |
| E-mail do administrador            | Único em todo o sistema; cada usuário pertence a um único restaurante   |
| Moeda                              | Real (BRL), formatado em pt-BR                                          |
| Categoria sem produtos disponíveis | Não aparece no cardápio público                                         |
| Sessão administrativa              | Tabela `admin_sessions` (token aleatório no cookie, só o hash no banco) |

## Pontos em aberto

1. Exclusão de categoria com produtos: bloquear, mover produtos ou excluir em cascata?
2. Restaurante pode alterar o slug? Isso invalida QR Codes já impressos.
3. Duração da sessão administrativa e política de expiração por inatividade.
4. Limites de upload: formatos aceitos, tamanho máximo e dimensões das fotos.
5. Serviço de armazenamento de imagens em produção (ex.: S3, Cloudflare R2).
6. Cadastro de novos restaurantes e administradores: quem realiza, já que não há painel central.
7. Cores da identidade visual: validar contraste mínimo com o texto branco do cabeçalho?
