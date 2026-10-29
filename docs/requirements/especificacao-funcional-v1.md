# Especificação Funcional — Cardápio Digital

**Versão:** 1.0 — Baseline consolidada
**Tipo:** MVP — Produto Web Responsivo
**Situação:** Escopo funcional consolidado
**Público-alvo:** Restaurantes e seus clientes

> Revisões de escopo posteriores a esta baseline estão registradas em [README.md](README.md)
> (a partir da DEC-006).

---

## 1. Objetivo

Desenvolver um sistema de Cardápio Digital, acessível por QR Code, que permita a diferentes
restaurantes administrar seus respectivos cardápios por meio de uma retaguarda web.

Cada restaurante possuirá suas próprias informações, produtos, categorias, fotografias, identidade
visual e QR Code.

Os clientes acessarão o cardápio público pelo navegador do celular, sem necessidade de autenticação
ou instalação de aplicativo.

As alterações publicadas na retaguarda deverão ser refletidas automaticamente no cardápio, inclusive
quando a página já estiver aberta.

## 2. Decisões funcionais aprovadas

| ID      | Definição                     | Decisão                                   |
| ------- | ----------------------------- | ----------------------------------------- |
| DEC-001 | Estrutura do sistema          | Múltiplos restaurantes independentes      |
| DEC-002 | Dados obrigatórios do produto | Nome, preço, categoria e fotografia       |
| DEC-003 | Produtos indisponíveis        | Ocultar do cardápio público               |
| DEC-004 | Atualização das informações   | Automática, inclusive com a página aberta |
| DEC-005 | Detalhes do produto           | Modal sobre o cardápio                    |

Estas decisões passam a integrar a baseline funcional do MVP.

## 3. Arquitetura funcional

O sistema será composto por dois ambientes:

### 3.1. Retaguarda Administrativa

Ambiente autenticado responsável pelo gerenciamento das informações do restaurante.

Cada administrador deverá operar exclusivamente sobre os dados do restaurante ao qual estiver
vinculado.

### 3.2. Cardápio Digital Público

Interface responsiva para consulta aos produtos de um restaurante específico, identificada por uma
URL própria e acessível pelo respectivo QR Code.

### 3.3. Isolamento entre restaurantes

O sistema deverá garantir isolamento lógico de dados entre estabelecimentos, de forma que:

- Cada restaurante tenha seu próprio cardápio.
- Categorias e produtos pertençam a um restaurante específico.
- Administradores não possam consultar ou alterar dados administrativos de outros restaurantes.
- A personalização visual de um restaurante não afete os demais.
- Cada QR Code direcione exclusivamente ao cardápio correspondente.

A gestão central de criação de restaurantes e usuários não integra o escopo funcional deste MVP.
Os vínculos administrativos necessários deverão existir para que os módulos previstos operem.

---

## 4. Módulos e requisitos funcionais

### MOD-01 — Autenticação Administrativa

**HU-001:** Como administrador, quero acessar a retaguarda do meu restaurante mediante
autenticação, para gerenciar exclusivamente seu cardápio.

**Requisitos funcionais**

- **RF-001:** Disponibilizar autenticação administrativa com identificação do usuário e senha.
- **RF-002:** Validar as credenciais e identificar o restaurante vinculado ao usuário autenticado.
- **RF-003:** Restringir o acesso e as operações administrativas aos dados do restaurante vinculado.
- **RF-004:** Exibir mensagem de erro quando a autenticação não for válida.

**Critérios de aceite**

- **CA-001:** Dadas credenciais válidas, o usuário deverá acessar a retaguarda correspondente ao
  seu restaurante.
- **CA-002:** Dadas credenciais inválidas, o sistema deverá impedir o acesso e apresentar mensagem
  apropriada.
- **CA-003:** Um administrador não poderá acessar ou modificar dados administrativos pertencentes a
  outro restaurante, inclusive por requisições diretas à API.

### MOD-02 — Gestão de Categorias

**HU-002:** Como administrador, quero cadastrar, editar e ordenar categorias do meu restaurante,
para organizar os produtos exibidos aos clientes.

**Requisitos funcionais**

- **RF-005:** Permitir cadastrar categorias vinculadas ao restaurante autenticado.
- **RF-006:** Permitir editar o nome das categorias cadastradas.
- **RF-007:** Permitir definir a ordem de apresentação das categorias.
- **RF-008:** Disponibilizar no cardápio público as categorias do respectivo restaurante,
  respeitando a ordem definida.

**Critérios de aceite**

- **CA-004:** Uma categoria salva deverá pertencer exclusivamente ao restaurante autenticado.
- **CA-005:** A alteração do nome deverá ser refletida no cardápio correspondente.
- **CA-006:** As categorias deverão aparecer na ordem definida na retaguarda.

### MOD-03 — Gestão de Produtos

**HU-003:** Como administrador, quero cadastrar e editar produtos com nome, preço, categoria e
fotografia obrigatórios, para manter as informações do cardápio completas.

**Requisitos funcionais**

- **RF-009:** Permitir cadastrar produtos pertencentes ao restaurante autenticado e associados a
  uma de suas categorias.
- **RF-010:** Permitir editar nome, descrição curta e descrição detalhada do produto.
- **RF-011:** Permitir cadastrar e alterar o preço do produto.
- **RF-012:** Permitir enviar e substituir a fotografia do produto, mantendo-a obrigatória para
  publicação.
- **RF-013:** Disponibilizar os dados salvos dos produtos no cardápio público do restaurante
  correspondente.

**Campos previstos**

| Campo               | Obrigatório             |
| ------------------- | ----------------------- |
| Nome do produto     | Sim                     |
| Preço               | Sim                     |
| Categoria           | Sim                     |
| Fotografia          | Sim                     |
| Descrição curta     | Não                     |
| Descrição detalhada | Não                     |
| Ordem de exibição   | Controlada pelo sistema |
| Situação do produto | Controlada pelo sistema |

**Critérios de aceite**

- **CA-007:** O sistema deverá impedir a publicação quando nome, preço válido, categoria ou
  fotografia estiverem ausentes.
- **CA-008:** O preço publicado deverá corresponder ao valor salvo e ser apresentado em reais (R$).
- **CA-009:** O cardápio deverá apresentar a fotografia correspondente ao produto, sem misturar
  imagens de outros produtos ou restaurantes.
- **CA-010:** Uma edição salva deverá atualizar os dados publicados do produto correspondente.

### MOD-04 — Controle de Disponibilidade

**HU-004:** Como administrador, quero controlar a situação dos produtos para impedir que itens
inativos ou indisponíveis apareçam aos clientes.

**Requisitos funcionais**

- **RF-014:** Permitir definir o produto como ativo ou inativo.
- **RF-015:** Permitir definir o produto como disponível ou indisponível.
- **RF-016:** Ocultar do cardápio público os produtos inativos ou indisponíveis.

**Critérios de aceite**

- **CA-011:** Produtos ativos e disponíveis, com cadastro válido, deverão ser apresentados no
  cardápio público.
- **CA-012:** Produtos inativos não deverão aparecer nas listagens, buscas e filtros do cardápio.
- **CA-013:** Produtos indisponíveis não deverão aparecer nas listagens, buscas e filtros do
  cardápio.
- **CA-014:** Ao voltar à situação ativa e disponível, um produto válido deverá voltar a ser
  apresentado automaticamente.

### MOD-05 — Ordenação de Produtos

**HU-005:** Como administrador, quero ordenar os produtos dentro das categorias para controlar a
sequência de apresentação aos clientes.

**Requisitos funcionais**

- **RF-017:** Permitir alterar a ordem dos produtos dentro de suas categorias.
- **RF-018:** Salvar a ordem definida na retaguarda do restaurante.
- **RF-019:** Aplicar a ordenação publicada à listagem mobile correspondente.

**Critérios de aceite**

- **CA-015:** A sequência salva deverá permanecer após nova consulta à retaguarda.
- **CA-016:** O cardápio do restaurante deverá apresentar os produtos na sequência configurada,
  inclusive após atualização automática.

### MOD-06 — Cardápio Digital Mobile

**HU-006:** Como cliente, quero acessar o cardápio do restaurante pelo celular, buscar produtos e
filtrar categorias, para consultar rapidamente as opções disponíveis.

**Requisitos funcionais**

- **RF-020:** Disponibilizar uma URL pública específica para cada restaurante.
- **RF-021:** Apresentar interface responsiva, priorizando dispositivos móveis.
- **RF-022:** Exibir categorias e produtos pertencentes exclusivamente ao restaurante acessado.
- **RF-023:** Permitir buscar produtos publicados pelo nome.
- **RF-024:** Permitir filtrar os produtos por categoria.
- **RF-025:** Exibir fotografia, nome, descrição curta quando informada e preço.
- **RF-026:** Permitir acesso ao cardápio público sem autenticação.

**Critérios de aceite**

- **CA-017:** A URL de um restaurante deverá abrir exclusivamente seu cardápio em um navegador
  mobile.
- **CA-018:** A busca deverá apresentar apenas produtos publicados do restaurante cujo nome
  corresponda ao termo pesquisado.
- **CA-019:** O filtro por categoria deverá apresentar apenas produtos correspondentes à categoria
  selecionada.
- **CA-020:** Os dados mostrados na listagem deverão corresponder às informações publicadas.
- **CA-021:** A navegação mobile deverá funcionar sem rolagem horizontal da página, sem instalação
  e sem login.

### MOD-07 — Detalhamento do Produto por Modal

**HU-007:** Como cliente, quero abrir os detalhes de um produto em uma janela sobre o cardápio,
para consultar suas informações sem perder a navegação atual.

**Requisitos funcionais**

- **RF-027:** Permitir abrir os detalhes do produto selecionado em um modal.
- **RF-028:** Apresentar no modal fotografia ampliada, nome, descrição detalhada quando cadastrada
  e preço.
- **RF-029:** Permitir fechar o modal e retornar à mesma posição da listagem.

**Critérios de aceite**

- **CA-022:** Ao selecionar um produto, o modal deverá ser exibido sobre o cardápio, sem navegar
  para outra página.
- **CA-023:** O modal deverá apresentar os dados correspondentes ao produto selecionado.
- **CA-024:** Ao fechar o modal, o cliente deverá retornar à listagem mantendo a categoria, a
  busca e a posição de navegação anteriores.

### MOD-08 — Atualização Automática dos Dados

**HU-008:** Como administrador, quero que as alterações publicadas sejam refletidas
automaticamente, inclusive nos cardápios já abertos pelos clientes.

**Requisitos funcionais**

- **RF-030:** Disponibilizar automaticamente as alterações salvas e publicadas na retaguarda.
- **RF-031:** Atualizar automaticamente categorias, produtos, preços, fotografias, ordenação,
  disponibilidade e personalização, inclusive com o cardápio aberto.
- **RF-032:** Atualizar as informações exibidas sem exigir recarregamento manual da página e sem
  nova implantação da aplicação.

**Critérios de aceite**

- **CA-025:** Após uma alteração ser salva e publicada, um cliente com o cardápio aberto deverá
  receber os dados atualizados automaticamente, sem pressionar o botão de atualizar do navegador.
- **CA-026:** Quando um produto for marcado como indisponível, deverá deixar de aparecer
  automaticamente nas listagens abertas, sem alterar o QR Code.
- **CA-027:** Alterações publicadas deverão refletir no cardápio correspondente sem necessidade de
  nova implantação.

**Diretriz de implementação:** a atualização poderá utilizar comunicação em tempo real ou consulta
periódica, desde que atenda aos critérios funcionais estabelecidos. A técnica de sincronização não
deverá alterar a experiência de consulta do cliente.

### MOD-09 — Geração e Download do QR Code

**HU-009:** Como administrador, quero gerar e baixar o QR Code específico do meu restaurante para
disponibilizar o acesso ao cardápio.

**Requisitos funcionais**

- **RF-033:** Gerar um QR Code vinculado à URL pública específica do restaurante.
- **RF-034:** Permitir visualizar o QR Code na retaguarda correspondente.
- **RF-035:** Permitir baixar o QR Code em formato de imagem.
- **RF-036:** Manter a URL pública e o QR Code válidos após alterações no conteúdo do cardápio.

**Critérios de aceite**

- **CA-028:** A leitura do QR Code deverá abrir o cardápio do restaurante correspondente.
- **CA-029:** O administrador deverá conseguir baixar a imagem do QR Code do seu restaurante.
- **CA-030:** Alterações nos produtos, categorias e personalização não deverão exigir a geração de
  outro QR Code.

### MOD-10 — Personalização Visual

**HU-010:** Como administrador, quero configurar nome, logotipo e cores do meu restaurante para
personalizar seu cardápio público.

**Requisitos funcionais**

- **RF-037:** Permitir configurar o nome do restaurante autenticado.
- **RF-038:** Permitir enviar e substituir o logotipo do restaurante.
- **RF-039:** Permitir definir as cores principais da interface.
- **RF-040:** Aplicar a personalização exclusivamente ao cardápio público do restaurante
  correspondente.

**Critérios de aceite**

- **CA-031:** O nome configurado deverá aparecer no cardápio do restaurante.
- **CA-032:** O logotipo cadastrado deverá ser apresentado na interface correspondente.
- **CA-033:** As cores configuradas deverão ser aplicadas ao cardápio, preservando a legibilidade.
- **CA-034:** Alterações de personalização deverão ser refletidas automaticamente no cardápio
  publicado, inclusive quando a página estiver aberta.

---

## 5. Regras de negócio consolidadas

| Código | Regra                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------ |
| RN-001 | Somente usuários autenticados podem acessar as funções administrativas.                                |
| RN-002 | Cada administrador somente pode operar sobre os dados de seu restaurante vinculado.                    |
| RN-003 | Todos os produtos devem estar associados a uma categoria do mesmo restaurante.                         |
| RN-004 | Nome, preço válido, categoria e fotografia são obrigatórios para publicação do produto.                |
| RN-005 | O preço exibido deverá corresponder ao valor publicado na retaguarda.                                  |
| RN-006 | Produtos inativos deverão permanecer ocultos no cardápio público.                                      |
| RN-007 | Produtos indisponíveis deverão permanecer ocultos no cardápio público.                                 |
| RN-008 | A ordenação das categorias e produtos deverá respeitar a configuração administrativa do restaurante.   |
| RN-009 | A busca deverá considerar exclusivamente os produtos publicados e visíveis do restaurante acessado.    |
| RN-010 | O filtro por categoria deverá considerar exclusivamente os produtos visíveis da categoria selecionada. |
| RN-011 | O cardápio público não deverá exigir autenticação.                                                     |
| RN-012 | Alterações publicadas deverão atualizar automaticamente o cardápio, inclusive quando estiver aberto.   |
| RN-013 | A atualização de produtos, categorias, preços e identidade visual não deverá invalidar o QR Code.      |
| RN-014 | Cada restaurante deverá possuir endereço público próprio e QR Code correspondente.                     |
| RN-015 | Os dados e a identidade visual de um restaurante não deverão interferir nos dados dos demais.          |
| RN-016 | Os detalhes dos produtos deverão ser apresentados em modal sobre o cardápio.                           |
| RN-017 | O fechamento do modal deverá preservar o contexto anterior de navegação do cliente.                    |

---

## 6. Fluxos funcionais consolidados

### Fluxo A — Cadastro de Produto

1. O administrador acessa a retaguarda do seu restaurante.
2. Abre a área de produtos.
3. Informa nome, preço, categoria e fotografia.
4. Opcionalmente, informa as descrições.
5. Define a situação do produto.
6. Salva o cadastro.
7. O sistema valida os dados obrigatórios.
8. O produto é disponibilizado no cardápio específico do restaurante, quando ativo e disponível.
9. Os clientes com o cardápio aberto recebem a atualização automaticamente.

### Fluxo B — Consulta do Cardápio

1. O cliente lê o QR Code.
2. O sistema identifica o restaurante pela URL pública.
3. Exibe seu nome, logotipo, cores e categorias.
4. Apresenta exclusivamente os produtos ativos e disponíveis.
5. O cliente pode buscar ou filtrar produtos.
6. Ao selecionar um produto, o sistema abre um modal.
7. Ao fechar o modal, retorna à listagem anterior sem perder o contexto.

### Fluxo C — Indisponibilidade de Produto

1. O administrador acessa o cadastro de um produto.
2. Altera a situação para indisponível.
3. Salva a alteração.
4. O sistema deixa de apresentar o produto na consulta pública.
5. Os cardápios já abertos recebem a atualização automaticamente.
6. O QR Code permanece inalterado.

### Fluxo D — Personalização do Restaurante

1. O administrador acessa a personalização.
2. Configura nome, logotipo e cores.
3. Salva as alterações.
4. O sistema aplica a identidade visual exclusivamente ao cardápio daquele restaurante.
5. A atualização é refletida automaticamente nos cardápios abertos.

---

## 7. Matriz de rastreabilidade

| História | Módulo                 | Requisitos      | Critérios       |
| -------- | ---------------------- | --------------- | --------------- |
| HU-001   | Autenticação           | RF-001 a RF-004 | CA-001 a CA-003 |
| HU-002   | Categorias             | RF-005 a RF-008 | CA-004 a CA-006 |
| HU-003   | Produtos               | RF-009 a RF-013 | CA-007 a CA-010 |
| HU-004   | Disponibilidade        | RF-014 a RF-016 | CA-011 a CA-014 |
| HU-005   | Ordenação              | RF-017 a RF-019 | CA-015 a CA-016 |
| HU-006   | Cardápio Mobile        | RF-020 a RF-026 | CA-017 a CA-021 |
| HU-007   | Modal de Produto       | RF-027 a RF-029 | CA-022 a CA-024 |
| HU-008   | Atualização Automática | RF-030 a RF-032 | CA-025 a CA-027 |
| HU-009   | QR Code                | RF-033 a RF-036 | CA-028 a CA-030 |
| HU-010   | Personalização         | RF-037 a RF-040 | CA-031 a CA-034 |

---

## 8. Exclusões do MVP

Não integram esta versão: carrinho, pedidos, pagamentos, controle de estoque, reservas,
avaliações, cupons, fidelidade, cadastro de clientes ou painel central de administração comercial
de restaurantes.

Essas funcionalidades não deverão ser adicionadas durante o desenvolvimento sem revisão formal de
escopo.

## 9. Considerações para implementação e homologação

A arquitetura deverá suportar múltiplos restaurantes desde a primeira versão, com isolamento de
dados também nas operações da API.

A atualização automática deverá ser validada utilizando simultaneamente uma sessão administrativa
e uma sessão mobile já aberta.

O comportamento do modal deverá ser homologado especialmente em dispositivos móveis, verificando
apresentação, fechamento e preservação da posição de navegação.

**Pontos técnicos ainda não quantificados:** intervalo máximo aceitável para propagação das
atualizações, limites de tamanho/formato das fotografias e regras específicas de criação inicial
das contas administrativas. Essas definições não representam novas funcionalidades e deverão ser
registradas antes da homologação técnica.

---

**Fim da especificação funcional — MVP v1.0.**
