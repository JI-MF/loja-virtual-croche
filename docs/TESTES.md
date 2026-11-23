# Testes Automatizados

## 1. Introdução

Este documento apresenta a estratégia de testes automatizados utilizada no projeto Produções da Vick Crochê, desenvolvido com Next.js.

Os testes foram implementados com o objetivo de verificar o funcionamento das funcionalidades da aplicação, validar as regras de negócio, identificar possíveis erros e garantir que alterações futuras não comprometam funcionalidades já existentes.

## 2. Tecnologias utilizadas

Para a implementação dos testes automatizados, foram utilizadas as seguintes tecnologias:

- **Vitest:** framework utilizado para execução e organização dos testes automatizados.
- **V8 Coverage:** ferramenta utilizada para mensurar a cobertura de código dos testes.
- **JavaScript:** linguagem utilizada na implementação dos testes e da aplicação.

## 3. Organização dos testes

Os testes automatizados estão organizados dentro do diretório `src/__tests__/unit_tests`.

Os arquivos de teste possuem a extensão `.test.js` e estão organizados de acordo com as funcionalidades e rotas da aplicação.

A implementação utiliza mocks para simular dependências externas e componentes da aplicação, permitindo verificar o comportamento das funcionalidades de forma isolada.

Essa organização facilita a manutenção, identificação e execução dos testes.

## 4. Funcionalidades testadas

Os testes automatizados abrangem as principais funcionalidades da aplicação, incluindo:

- Cadastro de clientes;
- Autenticação de clientes;
- Autenticação administrativa;
- Solicitação, validação e gerenciamento de códigos OTP;
- Cadastro e consulta de leads;
- Consulta de produtos;
- Consulta de categorias;
- Criação e consulta de pedidos;
- Gerenciamento administrativo de pedidos;
- Dashboard administrativo;
- Checkout e processamento de pagamentos;
- Webhook de integração com o Mercado Pago;
- Validação de dados e tratamento de erros.

## 5. Execução dos testes

Para executar todos os testes automatizados, deve-se utilizar o seguinte comando:

```bash
npm test
```

Para executar os testes e gerar o relatório de cobertura de código, utiliza-se:

```bash
npm test -- --coverage
```

A cobertura é calculada utilizando a ferramenta V8 e os resultados são apresentados no terminal.

Além disso, é gerado um relatório HTML no diretório `coverage/`, permitindo visualizar detalhadamente a cobertura de cada arquivo.

## 6. Cobertura de código

A cobertura de código é utilizada para avaliar o percentual de código executado durante os testes automatizados.

O relatório apresenta quatro métricas principais:

- **Statements:** percentual de instruções executadas;
- **Branches:** percentual de caminhos condicionais testados;
- **Functions:** percentual de funções executadas;
- **Lines:** percentual de linhas de código executadas.

## 7. Resultados obtidos

Após a implementação e execução dos testes automatizados, foram obtidos os seguintes resultados:

| Métrica | Resultado |
|---|---:|
| Arquivos de teste aprovados | 20 |
| Testes aprovados | 239 |
| Statements | 96,56% |
| Branches | 93,83% |
| Functions | 100% |
| Lines | 96,55% |

Todos os arquivos de teste foram executados com sucesso, sem falhas.

## 8. Considerações finais

A implementação dos testes automatizados contribuiu para aumentar a confiabilidade da aplicação, permitindo verificar o funcionamento das principais funcionalidades e regras de negócio.

A cobertura obtida demonstra que uma parcela significativa do código foi executada durante os testes, proporcionando maior segurança para futuras alterações, correções e implementações de novas funcionalidades.

Os testes automatizados também contribuem para a manutenção do sistema, reduzindo o risco de regressões e facilitando a identificação de problemas durante o desenvolvimento.
