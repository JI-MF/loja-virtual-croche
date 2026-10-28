
# Produções da Vick Crochê

Aplicação web para a loja **Produções da Vick Crochê**, desenvolvida para apresentar produtos artesanais de crochê e oferecer recursos para o atendimento aos clientes e o gerenciamento de pedidos.

O projeto está sendo desenvolvido com Next.js, React, Prisma e MySQL, incluindo funcionalidades de cadastro e autenticação de clientes, gerenciamento de pedidos e integração com o Mercado Pago.

## Objetivos do projeto

- Apresentar os produtos da loja de forma organizada.
- Facilitar o contato entre clientes e a loja.
- Implementar o cadastro e a autenticação de clientes.
- Permitir a criação e o acompanhamento de pedidos.
- Integrar o processo de pagamento ao Mercado Pago.
- Utilizar boas práticas de desenvolvimento e organização de código.

## Tecnologias utilizadas

- **Next.js:** framework para desenvolvimento da aplicação web e das rotas da API.
- **React:** construção das interfaces.
- **JavaScript:** linguagem utilizada no desenvolvimento.
- **Tailwind CSS:** estilização das interfaces.
- **Base UI:** componentes de interface.
- **Lucide React:** biblioteca de ícones.
- **Prisma ORM:** acesso e interação com o banco de dados.
- **MySQL:** sistema de gerenciamento do banco de dados.
- **Mercado Pago SDK:** integração com os serviços de pagamento.
- **Zod:** validação de dados.
- **React Hook Form:** gerenciamento de formulários.
- **Nodemailer:** dependência instalada para funcionalidades de envio de e-mails.

## Funcionalidades

O projeto contempla o desenvolvimento das seguintes funcionalidades:

- [x] Estrutura inicial da aplicação web.
- [x] Catálogo de produtos e rotas para consulta de produtos.
- [x] Formulário de contato com validação dos dados.
- [x] Implementação de código OTP para verificação de e-mail.
- [x] Cadastro e autenticação de clientes.
- [x] Gerenciamento de sessão do cliente.
- [x] Criação e consulta de pedidos.
- [x] Cancelamento de pedidos pendentes, com devolução do estoque.
- [x] Implementação inicial do checkout com Mercado Pago.
- [ ] Finalização e validação do fluxo de pagamentos.
- [ ] Finalização e testes do webhook de notificações de pagamento.
- [ ] Finalização dos testes de integração do sistema.

> Os itens em andamento serão atualizados conforme a implementação e os testes forem concluídos.

## Requisitos para execução

Antes de executar o projeto, é necessário ter instalado:

- **Node.js**, em uma versão compatível com o Next.js utilizado.
- **npm**, instalado com o Node.js.
- **MySQL Server**, para execução do banco de dados.
- **Git**, para clonar o repositório.
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

As variáveis utilizadas pela aplicação devem ser definidas de acordo com a configuração do banco de dados, do serviço de e-mail e do Mercado Pago.

As variáveis de banco de dados utilizadas pelo adaptador Prisma incluem:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=croche
```

A integração com o Mercado Pago também utiliza configurações de ambiente, incluindo:

```env
MERCADO_PAGO_ACCESS_TOKEN=seu_access_token
MERCADO_PAGO_WEBHOOK_SECRET=seu_webhook_secret
```

Os valores acima são exemplos de preenchimento. Utilize suas próprias credenciais e configure as demais variáveis exigidas pelo código da aplicação.

**Importante:** nunca publique o arquivo `.env` nem envie credenciais reais para o GitHub. O arquivo deve permanecer protegido pelo `.gitignore`.

### 4. Preparar o banco de dados

Inicie o servidor MySQL e crie o banco de dados utilizado pelo projeto, conforme a configuração definida no arquivo `.env`.

O nome de banco de dados utilizado atualmente é `croche`.

O projeto utiliza o Prisma para acessar o banco de dados. O esquema está localizado em:

```text
prisma/schema.prisma
```

A configuração do Prisma está em:

```text
prisma7.config.ts
```

Antes de executar a aplicação em um ambiente novo, verifique as migrações disponíveis e aplique-as conforme a configuração atual do projeto.

## Executar a aplicação

Após instalar as dependências, configurar as variáveis de ambiente e preparar o banco de dados, execute:

```bash
npm run dev
```

Por padrão, a aplicação poderá ser acessada pelo navegador em:

http://localhost:3000

## Outros comandos disponíveis

Executar a verificação de build:

```bash
npm run build
```

Iniciar a aplicação em modo de produção após a compilação:

```bash
npm run start
```

Executar o ESLint:

```bash
npm run lint
```

## Estrutura principal do projeto

```text
croche/
├── prisma/
│   └── schema.prisma
├── public/
├── src/
├── .env
├── .gitignore
├── package.json
├── prisma7.config.ts
├── Dockerfile
└── README.md
```

A estrutura acima apresenta os principais diretórios e arquivos do projeto. Outros arquivos e subdiretórios podem existir dentro de `src/` e das demais pastas.

## Execução com Docker

As instruções para executar a aplicação com Docker serão adicionadas após a análise e a validação da configuração atual do ambiente Docker.

## Status do projeto

O sistema está em desenvolvimento. As funcionalidades são implementadas e testadas progressivamente, com atenção à validação dos dados, à segurança das sessões, à persistência no banco de dados e à integração com o serviço de pagamentos.

## Repositório

[GitHub — loja-virtual-croche](https://github.com/JI-MF/loja-virtual-croche)
