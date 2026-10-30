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

### DEC-007 — Foto do produto opcional no cadastro (revisão da RN-004)

O produto pode ser cadastrado e salvo sem foto. O cardápio público continua mostrando **apenas**
produtos com foto (além de ativos, disponíveis e em categoria visível), sem mudança visual. A foto
pode ser substituída ou removida; removida, o produto sai do cardápio até receber outra. O painel
mostra a situação de cada produto ("No cardápio", "Sem foto", "Indisponível", "Inativo",
"Categoria oculta").

### DEC-008 — Cardápio sem pedido

O cardápio não tem carrinho nem pedido. Foram removidos os controles que sugeriam pedido: botão
"+"/"Adicionar" do card, quantidade, observações e "Adicionar · total" dos detalhes do produto e o
aviso "adicionado". É a **única alteração visual autorizada** no cardápio público; todo o resto
permanece igual (verificado por comparação renderizada).

### DEC-009 — Dados do estabelecimento

O restaurante edita sempre (fora do módulo Personalização) o nome exibido e o contato do
estabelecimento: telefone e e-mail opcionais, de uso interno da plataforma, **nunca exibidos no
cardápio**. Logotipo e cores continuam no módulo Personalização visual. O slug não muda.

### DEC-010 — Recuperação de senha por e-mail

Restaurante e plataforma têm "Esqueci minha senha": link de uso único, válido por
`PASSWORD_RESET_TTL_MINUTES` (padrão 60 min), só o hash do token no banco, sem revelar se o e-mail
existe; a redefinição encerra todas as sessões. O **provedor de e-mail não foi definido**: o envio
usa o driver `log` (mensagem no console) apenas em desenvolvimento e testes; em produção o driver
padrão é `disabled` e a opção fica oculta no login até o provedor ser configurado. A troca de
senha logada (Minha conta) encerra as demais sessões.

### DEC-011 — Cobrança manual, histórico e controle de acesso

Complementa a DEC-006, sem gateway e sem inventar regras comerciais:

1. **Mensalidades** são geradas manualmente por mês (uma por restaurante ativo com assinatura
   iniciada até o fim do mês; repetir não duplica), com o valor copiado da assinatura: alterar a
   assinatura vale só para as próximas. Mensalidades nunca são apagadas.
2. **Pagamento** é um registro com data do pagamento, forma (Pix, boleto, transferência, cartão,
   dinheiro, outra), observação e autor; o valor é sempre o da mensalidade (não há pagamento
   parcial, juros, multa nem desconto). No máximo um pagamento válido por mensalidade.
3. **Estorno** exige motivo, mantém o registro (marcado como estornado, com autor e data) e devolve
   a mensalidade para "em aberto". **Cancelamento** só de mensalidade em aberto e com motivo
   (paga exige estorno antes); **reabertura** de cancelada também exige motivo.
4. **Situação calculada**: "a vencer" = em aberto com vencimento hoje ou depois; "vencida" = em
   aberto com vencimento anterior a hoje; "hoje" segue o fuso do negócio (`APP_TIMEZONE`).
   A situação financeira é separada da operacional (ativo/suspenso).
5. **Suspensão e reativação** continuam manuais, com motivo obrigatório nos dois sentidos; o
   histórico guarda autor, data e motivo, inclusive da suspensão encerrada.
6. **Responsáveis** do restaurante podem ser editados e ter o acesso bloqueado ou liberado (motivo
   opcional, registrado no histórico); o bloqueio encerra as sessões.
7. **Categorias** podem ser ocultadas (com seus produtos) sem apagar nada.
8. **Histórico de ações** (`audit_events`): cadastros, alterações, acessos, módulos e operações
   financeiras com autor, data, motivo e valores anteriores/novos. Não pode ser alterado pela
   aplicação.

## Definições técnicas (seção 9 e lacunas da baseline)

| Tema                            | Definição                                                                                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fotografia do produto (RN-004)  | Opcional no cadastro (DEC-007); o produto só aparece no cardápio com foto. Pode ser substituída ou removida.                                             |
| Imagens (fotos e logotipo)      | JPEG, PNG ou WebP, até 5 MB. O tipo é validado pelo conteúdo do arquivo, não pela extensão. Corpo de envio malformado responde 400.                      |
| Preço válido                    | Maior que zero, com no máximo 2 casas decimais, exibido em reais (pt-BR).                                                                                |
| Propagação das atualizações     | Tempo real via SSE; meta de até 2 s entre salvar na retaguarda e atualizar o cardápio aberto. Alterações em rajada viram uma recarga.                    |
| Reconexão do tempo real         | Conexão recusada ou encerrada é refeita em 5, 10, 20, 40 e depois a cada 60 s. Restaurante suspenso mantém a conexão para a reativação chegar.           |
| Contas iniciais                 | Restaurantes e administradores são criados pelo backoffice (DEC-006); o primeiro operador por script CLI.                                                |
| URL pública                     | `/cardapio/:slug`. O slug é definido na criação e não pode ser alterado (RN-013, RF-036). Em produção, `APP_PUBLIC_URL` precisa ser público.             |
| QR Code                         | PNG (1024 px) e SVG, preto sobre branco, sempre `APP_PUBLIC_URL/cardapio/:slug`; o painel avisa se o endereço é local ou de rede interna.                |
| Login do administrador          | E-mail (único no sistema) e senha. Cada administrador pertence a um único restaurante.                                                                   |
| Exclusões                       | Não há exclusão de categorias, produtos, mensalidades ou pagamentos. Produto sai do cardápio como "inativo"; categoria, como "oculta" (DEC-011).         |
| Categoria sem produtos visíveis | Não aparece no cardápio público.                                                                                                                         |
| Sessão administrativa           | Cookie HttpOnly com token aleatório (só o hash no banco); validade padrão de 12 h; `Secure` em produção ou com `APP_PUBLIC_URL` em HTTPS.                |
| Troca de senha e bloqueio       | Troca ou redefinição de senha encerra as demais sessões; responsável bloqueado perde as sessões e não entra mais.                                        |
| Limites de tentativas           | Login: 10 falhas por IP e e-mail e 50 por IP a cada 15 min; recuperação de senha: 5 por IP e e-mail e 20 por IP por hora. Atrás de proxy, `TRUST_PROXY`. |
| Envios repetidos                | Cadastros de restaurante, categoria, produto e pagamento aceitam `Idempotency-Key`: repetir o envio devolve o registro já feito.                         |
| Datas de negócio                | "Hoje" (vencimentos, vencidas, início da cobrança, data do pagamento) segue `APP_TIMEZONE` (padrão `America/Sao_Paulo`).                                 |
| Busca (CA-018)                  | Pelo nome do produto, sem diferenciar maiúsculas e acentos.                                                                                              |
| Legibilidade das cores (CA-033) | A cor do texto sobre a cor do restaurante é escolhida automaticamente por contraste. O painel avisa quando o fundo escolhido prejudica a leitura.        |

## Pontos em aberto (decisões de negócio pendentes)

1. Serviço de armazenamento de imagens em produção (ex.: S3, Cloudflare R2). Hoje: disco local
   (`storage/uploads`, que precisa ser persistente e servido em `/uploads`).
2. Política de expiração de sessão por inatividade (hoje: validade fixa).
3. Provedor de e-mail para a recuperação de senha (DEC-010).
4. Prazo de tolerância e suspensão automática por inadimplência (hoje: suspensão manual).
5. Reativação automática depois do pagamento (hoje: manual).
6. Geração automática mensal das mensalidades (hoje: manual, pelo backoffice).
7. Juros, multa, desconto, pagamento parcial e cobrança proporcional (hoje: não existem).
8. Cobrança de meses em que o restaurante esteve suspenso (hoje: suspenso não recebe mensalidade).
9. Correção da legibilidade do cardápio com cor de fundo escura (exige mudança visual no cardápio;
   hoje só há o aviso no painel).
10. Remoção de metadados (EXIF/GPS) das fotos enviadas.
11. Domínio definitivo (`APP_PUBLIC_URL`): trocá-lo depois invalida os QR Codes já impressos.
12. Tempo real com várias instâncias da API (o barramento de eventos é em memória).
