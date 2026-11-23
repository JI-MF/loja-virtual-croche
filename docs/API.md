# Documentação da API — Produções da Vick Crochê

## 1. Introdução

A API da aplicação Produções da Vick Crochê é responsável pela comunicação entre o frontend e o backend, permitindo o gerenciamento de clientes, produtos, categorias, leads, pedidos, pagamentos e funcionalidades administrativas.

A API foi desenvolvida utilizando Next.js, com rotas implementadas no App Router, integração com banco de dados MySQL por meio do Prisma ORM e processamento de pagamentos através do Mercado Pago.

## 2. Tecnologias utilizadas

- Next.js — implementação das rotas da API.
- JavaScript — linguagem utilizada.
- Prisma ORM — comunicação com o banco de dados.
- MySQL — sistema de gerenciamento de banco de dados relacional.
- @prisma/adapter-mariadb — adaptador utilizado na conexão do Prisma com o MySQL.
- Mercado Pago — processamento de pagamentos.
- Nodemailer — envio de e-mails.
- Cookies HTTP — gerenciamento de sessões de clientes e administradores.
## 3. Convenções

### 3.1. Formato das requisições

As requisições que enviam dados devem utilizar o formato JSON, quando aplicável.

```http
Content-Type: application/json
```

### 3.2. Formato das respostas

As respostas são retornadas em JSON, contendo dados, mensagens ou informações sobre erros.

### 3.3. Códigos HTTP

| Código | Descrição |
|---|---|
| 200 | Requisição realizada com sucesso |
| 201 | Recurso criado com sucesso |
| 400 | Dados ou parâmetros inválidos |
| 401 | Usuário não autenticado |
| 404 | Recurso não encontrado |
| 409 | Conflito de estado ou operação |
| 500 | Erro interno do servidor |
| 502 | Falha na comunicação com serviço externo |

Os códigos utilizados variam conforme a implementação de cada endpoint.

---

# 4. Autenticação de clientes

## 4.1. Cadastro de cliente

**Endpoint:** `/api/autenticacao/cadastro`

**Método:** `POST`

**Descrição:** Realiza o cadastro de um cliente, verificando se o e-mail já está registrado. Quando associado a um produto, também registra o interesse do cliente. Após o cadastro, solicita o envio de um código OTP para verificação do e-mail.

### Requisição

```json
{
  "nome": "Maria Silva",
  "email": "maria@example.com",
  "telefone": "92999999999",
  "produto_id": 1
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| nome | String | Sim | Nome do cliente |
| email | String | Sim | E-mail do cliente |
| telefone | String | Sim | Telefone do cliente |
| produto_id | Integer | Não | Identificador do produto associado ao cadastro |

### Respostas

| HTTP | Descrição |
|---|---|
| 201 | Cadastro realizado com sucesso |
| 400 | Dados inválidos |
| 404 | Produto não encontrado |
| 409 | E-mail já cadastrado |
| 500 | Erro durante o cadastro |

---

## 4.2. Solicitação de código OTP

**Endpoint:** `/api/autenticacao/solicitar-codigo`

**Método:** `POST`

**Descrição:** Solicita o envio de um código de autenticação ao e-mail do cliente.

### Requisição

```json
{
  "email": "maria@example.com"
}
```

### Respostas

| HTTP | Descrição |
|---|---|
| 200 | Solicitação processada |
| 400 | E-mail inválido |
| 429 | Solicitação realizada dentro do período de espera |
| 500 | Erro durante a solicitação |

O endpoint utiliza uma mensagem genérica para evitar revelar se determinado e-mail está cadastrado no sistema.

O intervalo mínimo para reenvio do código é de 60 segundos.

---

## 4.3. Validação do código OTP

**Endpoint:** `/api/autenticacao/validar`

**Método:** `POST`

**Descrição:** Valida o código OTP enviado ao e-mail do cliente e cria uma sessão autenticada.

### Requisição

```json
{
  "email": "maria@example.com",
  "codigo": "123456"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| email | String | Sim | E-mail do cliente |
| codigo | String | Sim | Código OTP de seis dígitos |

### Respostas

| HTTP | Descrição |
|---|---|
| 200 | Autenticação realizada com sucesso |
| 400 | Código inválido ou dados incorretos |
| 500 | Erro durante a autenticação |

Após a validação, o sistema cria uma sessão e configura o cookie `sessao_cliente`.

---

## 4.4. Verificação da sessão do cliente

**Endpoint:** `/api/autenticacao/sessao`

**Método:** `GET`

**Descrição:** Verifica se existe uma sessão válida e retorna os dados do cliente autenticado.

### Respostas

| HTTP | Descrição |
|---|---|
| 200 | Sessão válida |
| 401 | Sessão inexistente, inválida ou expirada |
| 500 | Erro durante a validação |

---

## 4.5. Logout do cliente

**Endpoint:** `/api/autenticacao/logout`

**Método:** `POST`

**Descrição:** Revoga a sessão do cliente e remove o cookie de autenticação.

### Respostas

| HTTP | Descrição |
|---|---|
| 200 | Logout realizado com sucesso |
| 500 | Erro durante o logout |

---

# 5. Cadastro e verificação de leads

## 5.1. Cadastro de lead

**Endpoint:** `/api/cadastro`

**Método:** `POST`

**Descrição:** Registra um lead interessado nos produtos da loja. Quando um produto é informado, verifica sua existência. Após o cadastro, solicita o envio de um código OTP para verificação do e-mail.

### Requisição

```json
{
  "nome": "Maria Silva",
  "email": "maria@example.com",
  "telefone": "92999999999",
  "mensagem": "Tenho interesse em uma bolsa artesanal.",
  "produto_id": 1
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| nome | String | Sim | Nome do lead |
| email | String | Sim | E-mail do lead |
| telefone | String | Sim | Telefone do lead |
| mensagem | String | Sim | Mensagem ou interesse informado |
| produto_id | Integer | Não | Produto relacionado ao interesse |

### Respostas

| HTTP | Descrição |
|---|---|
| 201 | Cadastro realizado com sucesso |
| 400 | Dados inválidos |
| 404 | Produto não encontrado |
| 500 | Erro durante o cadastro |

---

## 5.2. Reenvio de código OTP

**Endpoint:** `/api/otp/reenviar`

**Método:** `POST`

**Descrição:** Solicita o reenvio do código de verificação para um lead.

### Requisição

```json
{
  "contato_id": 1
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| contato_id | Integer | Sim | Identificador do contato |

### Respostas

| HTTP | Descrição |
|---|---|
| 200 | Novo código enviado com sucesso |
| 400 | Identificador inválido ou erro na operação |

---

## 5.3. Validação do OTP do lead

**Endpoint:** `/api/otp/validar`

**Método:** `POST`

**Descrição:** Valida o código OTP associado ao cadastro de um lead.

### Requisição

```json
{
  "contato_id": 1,
  "codigo": "123456"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| contato_id | Integer | Sim | Identificador do contato |
| codigo | String | Sim | Código OTP de seis dígitos |

### Respostas

| HTTP | Descrição |
|---|---|
| 200 | Código validado com sucesso |
| 400 | Dados inválidos ou código incorreto |
| 500 | Erro durante a validação |

---

# 6. Catálogo

## 6.1. Listagem de produtos

**Endpoint:** `/api/produtos`

**Método:** `GET`

**Descrição:** Retorna os produtos cadastrados na loja.

### Respostas

| HTTP | Descrição |
|---|---|
| 200 | Produtos retornados com sucesso |
| 500 | Erro ao consultar produtos |

---

## 6.2. Listagem de categorias

**Endpoint:** `/api/categorias`

**Método:** `GET`

**Descrição:** Retorna as categorias cadastradas, ordenadas alfabeticamente pelo nome.

### Respostas

| HTTP | Descrição |
|---|---|
| 200 | Categorias retornadas com sucesso |
| 500 | Erro ao consultar categorias |

---

# 7. Pedidos

## 7.1. Consulta dos pedidos do cliente

**Endpoint:** `/api/pedidos`

**Método:** `GET`

**Descrição:** Retorna os pedidos pertencentes ao cliente autenticado, ordenados do mais recente para o mais antigo.

A resposta inclui os itens do pedido, informações básicas dos produtos e pagamentos associados.

### Autenticação

Requer o cookie `sessao_cliente`.

### Respostas

| HTTP | Descrição |
|---|---|
| 200 | Pedidos consultados com sucesso |
| 401 | Cliente não autenticado ou sessão inválida |
| 500 | Erro durante a consulta |

---

## 7.2. Criação de pedido

**Endpoint:** `/api/pedidos`

**Método:** `POST`

**Descrição:** Cria um pedido para o cliente autenticado, verifica os produtos, calcula o valor total e reserva o estoque.

### Requisição

```json
{
  "itens": [
    {
      "produto_id": 1,
      "quantidade": 2
    },
    {
      "produto_id": 3,
      "quantidade": 1
    }
  ]
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| itens | Array | Sim | Produtos que compõem o pedido |
| produto_id | Integer | Sim | Identificador do produto |
| quantidade | Integer | Sim | Quantidade solicitada |

### Regras

- O cliente deve possuir uma sessão válida.
- O pedido deve conter entre 1 e 50 itens.
- Os identificadores dos produtos devem ser inteiros positivos.
- As quantidades devem ser inteiros positivos.
- Produtos repetidos são agrupados.
- Todos os produtos devem existir.
- O estoque deve ser suficiente.
- O valor total é calculado em centavos.
- A criação do pedido e a reserva do estoque ocorrem em uma transação.

### Respostas

| HTTP | Descrição |
|---|---|
| 201 | Pedido criado com sucesso |
| 400 | Dados inválidos ou produtos inexistentes |
| 401 | Cliente não autenticado |
| 409 | Estoque insuficiente |
| 500 | Erro durante a criação |

---

## 7.3. Consulta de pedido específico

**Endpoint:** `/api/pedidos/{id}`

**Método:** `GET`

**Descrição:** Retorna os detalhes de um pedido pertencente ao cliente autenticado.

### Parâmetros

| Parâmetro | Tipo | Descrição |
|---|---|---|
| id | Integer | Identificador do pedido |

### Respostas

| HTTP | Descrição |
|---|---|
| 200 | Pedido consultado com sucesso |
| 400 | ID inválido |
| 401 | Cliente não autenticado |
| 404 | Pedido não encontrado |
| 500 | Erro durante a consulta |

O endpoint verifica se o pedido pertence ao cliente autenticado.

---

## 7.4. Cancelamento de pedido

**Endpoint:** `/api/pedidos/{id}/cancelar`

**Método:** `POST`

**Descrição:** Cancela um pedido pendente e devolve ao estoque as quantidades dos produtos reservados.

### Regras

- O cliente deve estar autenticado.
- O pedido deve pertencer ao cliente.
- Somente pedidos com status `PENDENTE` podem ser cancelados.
- O cancelamento e a devolução do estoque são realizados em uma transação.

### Respostas

| HTTP | Descrição |
|---|---|
| 200 | Pedido cancelado e estoque devolvido |
| 400 | ID inválido |
| 401 | Cliente não autenticado |
| 404 | Pedido não encontrado |
| 409 | Pedido não pode ser cancelado |
| 500 | Erro durante o cancelamento |

---

# 8. Pagamentos

## 8.1. Checkout Mercado Pago

**Endpoint:** `/api/pedidos/{id}/checkout`

**Método:** `POST`

**Descrição:** Cria ou recupera uma ordem de pagamento no Mercado Pago para um pedido pendente.

### Autenticação

Requer o cookie `sessao_cliente`.

### Parâmetros

| Parâmetro | Tipo | Descrição |
|---|---|---|
| id | Integer | Identificador do pedido |

### Funcionamento

1. Valida a sessão do cliente.
2. Verifica se o pedido pertence ao cliente autenticado.
3. Verifica se o pedido está pendente.
4. Valida os itens e o valor total do pedido.
5. Cria ou recupera o registro de pagamento.
6. Verifica tentativas de pagamento anteriores.
7. Consulta ordens existentes no Mercado Pago.
8. Recupera um checkout ativo quando possível.
9. Cria uma nova ordem quando necessário.
10. Registra a tentativa de pagamento e retorna a URL de checkout.

### Respostas

| HTTP | Descrição |
|---|---|
| 201 | Checkout criado com sucesso |
| 400 | Pedido ou dados inválidos |
| 401 | Cliente não autenticado |
| 404 | Pedido não encontrado |
| 409 | Pedido não pode ser processado ou pagamento já realizado |
| 502 | Falha na comunicação com o Mercado Pago |
| 500 | Erro interno |

### Exemplo de resposta

```json
{
  "mensagem": "Checkout criado com sucesso.",
  "pedido_id": 1,
  "pagamento_id": 1,
  "tentativa_pagamento_id": 1,
  "checkout_url": "https://www.mercadopago.com.br/checkout/..."
}
```

---

# 9. Administração

## 9.1. Login administrativo

**Endpoint:** `/api/admin/autenticacao/login`

**Método:** `POST`

**Descrição:** Autentica um administrador por meio de e-mail e senha.

### Requisição

```json
{
  "email": "admin@example.com",
  "senha": "senha123"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| email | String | Sim | E-mail do administrador |
| senha | String | Sim | Senha do administrador |

### Respostas

| HTTP | Descrição |
|---|---|
| 200 | Autenticação realizada com sucesso |
| 400 | E-mail ou senha não informados |
| 401 | Credenciais incorretas |
| 500 | Erro durante a autenticação |

O endpoint configura o cookie `sessao_admin`, com propriedades `HttpOnly`, `SameSite=Lax`, `Path=/` e `Secure` em produção.

---

## 9.2. Logout administrativo

**Endpoint:** `/api/admin/autenticacao/logout`

**Método:** `POST`

**Descrição:** Revoga a sessão administrativa e remove o cookie de autenticação.

### Respostas

| HTTP | Descrição |
|---|---|
| 200 | Logout realizado com sucesso |
| 500 | Erro durante o logout |

---

## 9.3. Verificação da sessão administrativa

**Endpoint:** `/api/admin/sessao`

**Método:** `GET`

**Descrição:** Verifica a validade da sessão administrativa e retorna os dados do administrador autenticado.

### Respostas

| HTTP | Descrição |
|---|---|
| 200 | Sessão válida |
| 401 | Sessão inválida ou expirada |
| 500 | Erro durante a validação |

---

# 10. Gerenciamento administrativo

## 10.1. Consulta de leads

**Endpoint:** `/api/admin/leads`

**Método:** `GET`

**Descrição:** Consulta leads cadastrados, permitindo busca por nome ou e-mail, filtro de verificação de e-mail e paginação.

### Parâmetros de consulta

| Parâmetro | Tipo | Padrão | Descrição |
|---|---|---|---|
| busca | String | — | Busca por nome ou e-mail |
| verificado | String | — | `true` ou `false` |
| pagina | Integer | 1 | Página desejada |
| limite | Integer | 10 | Registros por página, máximo 100 |

### Respostas

| HTTP | Descrição |
|---|---|
| 200 | Consulta realizada com sucesso |
| 400 | Parâmetros inválidos |
| 401 | Administrador não autenticado |
| 500 | Erro durante a consulta |

---

## 10.2. Consulta administrativa de pedidos

**Endpoint:** `/api/admin/pedidos`

**Método:** `GET`

**Descrição:** Consulta pedidos com busca, filtros e paginação.

### Parâmetros de consulta

| Parâmetro | Tipo | Padrão | Descrição |
|---|---|---|---|
| busca | String | — | Busca por nome, e-mail ou ID do pedido |
| status | String | — | Status do pedido |
| statusPagamento | String | — | Status do pagamento |
| pagina | Integer | 1 | Página desejada |
| limite | Integer | 10 | Registros por página, máximo 100 |

### Status de pedido válidos

- `PENDENTE`
- `CONFIRMADO`
- `ENVIADO`
- `ENTREGUE`
- `CANCELADO`

### Status de pagamento válidos

- `PENDENTE`
- `EM_PROCESSAMENTO`
- `APROVADO`
- `RECUSADO`
- `CANCELADO`
- `ESTORNADO`
- `EM_DISPUTA`

### Respostas

| HTTP | Descrição |
|---|---|
| 200 | Consulta realizada com sucesso |
| 400 | Parâmetros inválidos |
| 401 | Administrador não autenticado |
| 500 | Erro durante a consulta |

---

## 10.3. Consulta de detalhes de pedido administrativo

**Endpoint:** `/api/admin/pedidos/{id}`

**Método:** `GET`

**Descrição:** Retorna detalhes de um pedido, incluindo cliente, produtos, pagamentos, tentativas de pagamento e próximos status permitidos.

### Respostas

| HTTP | Descrição |
|---|---|
| 200 | Pedido encontrado |
| 400 | ID inválido |
| 401 | Administrador não autenticado |
| 404 | Pedido não encontrado |
| 500 | Erro durante a consulta |

---

## 10.4. Atualização do status de pedido

**Endpoint:** `/api/admin/pedidos/{id}`

**Método:** `PATCH`

**Descrição:** Atualiza o status de um pedido respeitando as transições permitidas pela lógica de negócio.

### Requisição

```json
{
  "status": "CONFIRMADO"
}
```

### Respostas

| HTTP | Descrição |
|---|---|
| 200 | Status atualizado com sucesso |
| 400 | ID, status ou transição inválida |
| 401 | Administrador não autenticado |
| 404 | Pedido não encontrado |
| 409 | Conflito de atualização concorrente |
| 500 | Erro durante a atualização |

---

# 11. Dashboard administrativo

## 11.1. Consulta de indicadores

**Endpoint:** `/api/admin/dashboard`

**Método:** `GET`

**Descrição:** Retorna os indicadores utilizados no dashboard administrativo.

### Indicadores

| Campo | Descrição |
|---|---|
| totalPedidos | Quantidade total de pedidos |
| pedidosPendentes | Quantidade de pedidos pendentes |
| totalLeads | Quantidade total de leads |
| faturamentoTotal | Soma dos pagamentos aprovados |

### Dados para gráficos

#### Vendas por mês

Retorna os valores das vendas aprovadas nos últimos seis meses, incluindo o mês atual.

#### Pedidos por status

Retorna a quantidade de pedidos agrupados por status.

### Respostas

| HTTP | Descrição |
|---|---|
| 200 | Indicadores retornados com sucesso |
| 401 | Administrador não autenticado |
| 500 | Erro durante a consulta |

---

# 12. Webhook do Mercado Pago

## 12.1. Processamento de notificações de pagamento

**Endpoint:** `/api/webhooks/mercado-pago`

**Método:** `POST`

**Descrição:** Recebe notificações do Mercado Pago, valida sua assinatura e sincroniza os pagamentos e pedidos no banco de dados.

### Parâmetros de consulta

| Parâmetro | Descrição |
|---|---|
| data.id | Identificador da ordem no Mercado Pago |
| type | Tipo de notificação |

Tipos de notificação tratados:

- `order`
- `orders`
- `orders_v2`

### Cabeçalhos obrigatórios

| Cabeçalho | Descrição |
|---|---|
| x-signature | Assinatura da notificação |
| x-request-id | Identificador da requisição |

### Validação de segurança

A assinatura é validada por meio do SDK Mercado Pago, utilizando a variável de ambiente `MERCADO_PAGO_WEBHOOK_SECRET`.

A validação utiliza tolerância de 300 segundos.

### Mapeamento de status

| Status Mercado Pago | Status interno |
|---|---|
| created | PENDENTE |
| processing | EM_PROCESSAMENTO |
| action_required | EM_PROCESSAMENTO |
| processed | APROVADO |
| failed | RECUSADO |
| canceled | CANCELADO |
| refunded | ESTORNADO |
| charged_back | EM_DISPUTA |

### Regras de processamento

- Consulta a ordem diretamente no Mercado Pago.
- Verifica a existência da tentativa de pagamento correspondente.
- Valida a referência externa do pedido.
- Confere o valor e a moeda da transação.
- Atualiza a tentativa de pagamento.
- Sincroniza o pagamento principal quando a tentativa é a mais recente.
- Respeita as transições de status permitidas.
- Confirma o pedido quando o pagamento é aprovado e o pedido está pendente.
- Envia o e-mail de confirmação quando o pedido está confirmado e ainda não possui confirmação registrada.
- Ignora atualizações duplicadas ou inválidas.
- Não aplica automaticamente pagamentos aprovados de pedidos cancelados.
- Reembolsos parciais exigem análise manual.

### Respostas

| HTTP | Descrição |
|---|---|
| 200 | Notificação processada ou ignorada |
| 400 | Dados de validação ausentes |
| 401 | Assinatura inválida |
| 500 | Erro de configuração ou processamento |

---

# 13. Resumo dos endpoints

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/autenticacao/cadastro` | Cadastro de cliente |
| POST | `/api/autenticacao/solicitar-codigo` | Solicitação de OTP |
| POST | `/api/autenticacao/validar` | Validação de OTP |
| GET | `/api/autenticacao/sessao` | Verificação da sessão |
| POST | `/api/autenticacao/logout` | Logout do cliente |
| POST | `/api/cadastro` | Cadastro de lead |
| POST | `/api/otp/reenviar` | Reenvio de OTP |
| POST | `/api/otp/validar` | Validação de OTP do lead |
| GET | `/api/produtos` | Listagem de produtos |
| GET | `/api/categorias` | Listagem de categorias |
| GET | `/api/pedidos` | Consulta de pedidos do cliente |
| POST | `/api/pedidos` | Criação de pedido |
| GET | `/api/pedidos/{id}` | Consulta de pedido específico |
| POST | `/api/pedidos/{id}/cancelar` | Cancelamento de pedido |
| POST | `/api/pedidos/{id}/checkout` | Criação de checkout |
| POST | `/api/admin/autenticacao/login` | Login administrativo |
| POST | `/api/admin/autenticacao/logout` | Logout administrativo |
| GET | `/api/admin/sessao` | Verificação da sessão administrativa |
| GET | `/api/admin/leads` | Consulta administrativa de leads |
| GET | `/api/admin/pedidos` | Consulta administrativa de pedidos |
| GET | `/api/admin/pedidos/{id}` | Detalhes de pedido administrativo |
| PATCH | `/api/admin/pedidos/{id}` | Atualização de status do pedido |
| GET | `/api/admin/dashboard` | Indicadores do dashboard |
| POST | `/api/webhooks/mercado-pago` | Webhook de pagamentos |

---

# 14. Considerações finais

A API permite a integração entre as interfaces da loja, o sistema administrativo, o banco de dados e os serviços externos de pagamento e envio de e-mails.

A implementação contempla mecanismos de autenticação, validação de dados, controle de sessões, verificação de estoque, transações, prevenção de inconsistências de pagamento e tratamento de erros.

A documentação apresenta os endpoints implementados e suas principais funcionalidades, servindo como referência para manutenção, testes e futuras evoluções do sistema.
