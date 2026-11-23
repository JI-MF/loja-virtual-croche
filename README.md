# Produções da Vick Crochê

Aplicação web para a loja **Produções da Vick Crochê**, desenvolvida para apresentar produtos artesanais de crochê e oferecer recursos para atendimento aos clientes, gerenciamento de pedidos e processamento de pagamentos.

O projeto utiliza Next.js, React, Prisma ORM e MySQL, incluindo funcionalidades de catálogo de produtos, cadastro e autenticação de clientes, gerenciamento de pedidos, administração da loja e integração com o Mercado Pago.

## Objetivos do projeto

- Apresentar os produtos da loja de forma organizada.
- Facilitar o contato entre clientes e a loja.
- Implementar o cadastro e a autenticação de clientes.
- Permitir a criação, consulta e cancelamento de pedidos.
- Integrar o processo de pagamento ao Mercado Pago.
- Disponibilizar funcionalidades administrativas para gerenciamento da loja.
- Utilizar boas práticas de desenvolvimento, segurança e organização de código.

## Tecnologias utilizadas

- **Next.js:** framework para desenvolvimento da aplicação web e das rotas da API.
- **React:** biblioteca para construção das interfaces.
- **JavaScript:** linguagem utilizada no desenvolvimento.
- **Tailwind CSS:** estilização das interfaces.
- **Base UI:** componentes de interface.
- **Lucide React:** biblioteca de ícones.
- **Prisma ORM:** ORM para acesso e gerenciamento do banco de dados.
- **MySQL:** sistema de gerenciamento de banco de dados (SGBD).
- **@prisma/adapter-mariadb:** adaptador utilizado na conexão do Prisma com o MySQL.
- **Mercado Pago SDK:** integração com os serviços de pagamento.
- **Zod:** validação de dados.
- **React Hook Form:** gerenciamento de formulários.
- **Nodemailer:** envio de e-mails.
- **bcryptjs:** criptografia de senhas.
- **Vitest:** framework para execução de testes automatizados.
- **V8 Coverage:** ferramenta para análise de cobertura de testes.

## Funcionalidades

### Loja e catálogo

- [x] Estrutura inicial da aplicação web.
- [x] Catálogo de produtos.
- [x] Consulta de produtos por categoria.
- [x] Consulta de categorias.
- [x] Formulário de contato com validação dos dados.

### Cadastro e autenticação de clientes

- [x] Cadastro de clientes.
- [x] Verificação de e-mail utilizando código OTP.
- [x] Autenticação de clientes.
- [x] Gerenciamento de sessão.
- [x] Reenvio de código de verificação.
- [x] Controle de expiração e tentativas de validação do código.

### Gerenciamento de pedidos

- [x] Criação de pedidos.
- [x] Consulta de pedidos do cliente autenticado.
- [x] Consulta de detalhes do pedido.
- [x] Cancelamento de pedidos pendentes.
- [x] Devolução de estoque após cancelamento.
- [x] Controle de status dos pedidos.

### Pagamentos

- [x] Implementação do checkout com Mercado Pago.
- [x] Registro e gerenciamento de tentativas de pagamento.
- [x] Integração com notificações de pagamento por webhook.
- [x] Atualização dos status de pagamento e pedidos.
- [x] Validação de assinatura das notificações recebidas.
- [x] Testes automatizados das rotas relacionadas aos pagamentos.

### Administração

- [x] Autenticação administrativa.
- [x] Gerenciamento de sessão administrativa.
- [x] Consulta e filtragem de leads.
- [x] Consulta e filtragem de pedidos.
- [x] Visualização de detalhes dos pedidos.
- [x] Atualização do status dos pedidos.
- [x] Dashboard administrativo com indicadores e gráficos.

### Testes e qualidade

- [x] Testes automatizados com Vitest.
- [x] Testes unitários das funções e serviços.
- [x] Testes das rotas da API.
- [x] Verificação de cobertura de código.
- [x] Configuração de integração contínua com GitHub Actions.
- [x] Verificação de lint.
- [x] Verificação de build da aplicação.

## Requisitos para execução

Antes de executar o projeto, é necessário ter instalado:

- **Node.js 24**
- **npm**
- **MySQL Server**
- **Git**
- Um editor de código, como o Visual Studio Code.

## Configuração do projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/JI-MF/loja-virtual-croche.git
```

Entre na pasta do projeto:

```bash
cd loja-virtual-croche
```

### 2. Instalar as dependências

Execute:

```bash
npm install
```

### 3. Configurar as variáveis de ambiente

Crie um arquivo chamado `.env` na raiz do projeto, no mesmo nível do `package.json`.

Configure as variáveis necessárias para a conexão com o banco de dados, autenticação, envio de e-mails e integração com o Mercado Pago.

Exemplo de configuração do banco de dados:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=croche
```

As integrações externas também utilizam variáveis de ambiente, como as credenciais do Mercado Pago e as configurações do serviço de e-mail.

Utilize suas próprias credenciais e consulte os arquivos de configuração da aplicação para identificar todas as variáveis exigidas.

**Importante:** nunca publique o arquivo `.env` nem envie credenciais reais para o GitHub. O arquivo deve permanecer protegido pelo `.gitignore`.

### 4. Preparar o banco de dados

Inicie o servidor MySQL e crie o banco de dados utilizado pelo projeto, conforme a configuração definida no arquivo `.env`.

O nome do banco de dados utilizado atualmente é `croche`.

O projeto utiliza o Prisma ORM para acessar e gerenciar o banco de dados.

O esquema está localizado em:

```text
prisma/schema.prisma
```

A configuração do Prisma está em:

```text
prisma7.config.ts
```

Antes de executar a aplicação em um ambiente novo, verifique as migrações disponíveis e aplique-as conforme a configuração atual do projeto.

### 5. Executar a aplicação

Após instalar as dependências, configurar as variáveis de ambiente e preparar o banco de dados, execute:

```bash
npm run dev
```

Por padrão, a aplicação poderá ser acessada pelo navegador em:

[http://localhost:3000](http://localhost:3000)

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Executa a aplicação em ambiente de desenvolvimento. |
| `npm run build` | Compila a aplicação para produção. |
| `npm run start` | Inicia a aplicação compilada. |
| `npm run lint` | Executa a verificação de código com ESLint. |
| `npm test` | Executa os testes automatizados. |
| `npm test -- --coverage` | Executa os testes e gera o relatório de cobertura. |

## Testes automatizados

O projeto utiliza o Vitest para execução dos testes automatizados e o V8 Coverage para análise da cobertura de código.

Os testes estão organizados em:

```text
src/__tests__/unit_tests/
```

Para executar os testes:

```bash
npm test
```

Para executar os testes com cobertura:

```bash
npm test -- --coverage
```

### Resultados da cobertura de testes

| Métrica | Resultado |
|---|---:|
| Arquivos de teste | 20 |
| Testes executados | 239 |
| Statements | 96,56% |
| Branches | 93,83% |
| Functions | 100% |
| Lines | 96,55% |

Os testes contemplam funcionalidades de autenticação, cadastro, OTP, catálogo, pedidos, administração, checkout e webhook do Mercado Pago.

O relatório HTML detalhado da cobertura é gerado no diretório `coverage/`.

Para mais informações sobre a organização e os resultados dos testes, consulte:

[`docs/TESTES.md`](docs/TESTES.md)

## Documentação da API

A documentação das rotas da API está disponível em:

[`docs/API.md`](docs/API.md)

O documento descreve os endpoints disponíveis, métodos HTTP, parâmetros, autenticação, respostas e principais regras de negócio.

## Estrutura principal do projeto

```text
croche/
├── .github/
│   └── workflows/
│       └── ci.yml
├── docs/
│   ├── API.md
│   └── TESTES.md
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── public/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   ├── autenticacao/
│   │   │   ├── cadastro/
│   │   │   ├── categorias/
│   │   │   ├── otp/
│   │   │   ├── pedidos/
│   │   │   ├── produtos/
│   │   │   └── webhooks/
│   │   ├── admin/
│   │   ├── autenticacao/
│   │   ├── pedido/
│   │   └── produtos/
│   ├── components/
│   ├── lib/
│   └── __tests__/
│       └── unit_tests/
├── .env
├── .gitignore
├── package.json
├── prisma7.config.ts
├── vitest.config.mjs
├── Dockerfile
└── README.md
```

A estrutura acima apresenta os principais diretórios e arquivos do projeto. Outros arquivos e subdiretórios podem existir dentro de `src/` e das demais pastas.

## Integração contínua

O projeto utiliza GitHub Actions para automatizar verificações durante o processo de desenvolvimento.

O workflow está localizado em:

```text
.github/workflows/ci.yml
```

As verificações incluem:

- Instalação das dependências.
- Execução do ESLint.
- Compilação da aplicação.

O workflow é executado em eventos de push e pull request para a branch `master`.

## Execução com Docker

A configuração e as instruções para executar a aplicação utilizando Docker serão adicionadas após a implementação e validação da infraestrutura de containers.

## Status do projeto

O projeto encontra-se em desenvolvimento.

As funcionalidades principais da loja, autenticação de clientes, gerenciamento de pedidos, administração e integração com pagamentos já foram implementadas.

Os testes automatizados e a integração contínua estão configurados. As próximas etapas incluem a documentação final, configuração de infraestrutura com Docker, preparação do ambiente de produção e implementação de integrações complementares.

## Repositório

[GitHub — Produções da Vick Crochê](https://github.com/JI-MF/loja-virtual-croche)
