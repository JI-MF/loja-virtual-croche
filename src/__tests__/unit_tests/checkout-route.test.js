
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  cookiesMock,
  validarSessaoClienteMock,
  findFirstPedidoMock,
  findUniquePagamentoMock,
  createPagamentoMock,
  updatePagamentoMock,
  findManyTentativaMock,
  createTentativaMock,
  updateTentativaMock,
  transactionMock,
  criarOrderMercadoPagoMock,
  consultarOrderMercadoPagoMock,
} = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  validarSessaoClienteMock: vi.fn(),

  findFirstPedidoMock: vi.fn(),

  findUniquePagamentoMock: vi.fn(),
  createPagamentoMock: vi.fn(),
  updatePagamentoMock: vi.fn(),

  findManyTentativaMock: vi.fn(),
  createTentativaMock: vi.fn(),
  updateTentativaMock: vi.fn(),

  transactionMock: vi.fn(),

  criarOrderMercadoPagoMock: vi.fn(),
  consultarOrderMercadoPagoMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/lib/sessao-cliente-service", () => ({
  validarSessaoCliente: validarSessaoClienteMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pedido: {
      findFirst: findFirstPedidoMock,
    },

    pagamento: {
      findUnique: findUniquePagamentoMock,
      create: createPagamentoMock,
      update: updatePagamentoMock,
    },

    tentativa_pagamento: {
      findMany: findManyTentativaMock,
      create: createTentativaMock,
      update: updateTentativaMock,
    },

    $transaction: transactionMock,
  },
}));

vi.mock("@/lib/mercado-pago-service", () => ({
  criarOrderMercadoPago: criarOrderMercadoPagoMock,
  consultarOrderMercadoPago: consultarOrderMercadoPagoMock,
}));

import { POST } from "@/app/api/pedidos/[id]/checkout/route";

describe("/api/pedidos/[id]/checkout", () => {
  const cliente = {
    id: 1,
    nome: "Cliente Teste",
    email: "cliente@example.com",
  };

  const pedido = {
    id: 10,
    cliente_id: 1,
    status: "PENDENTE",
    valor_total: "240.00",
    item_pedido: [
      {
        produto_id: 1,
        quantidade: 2,
        preco_unitario: "120.00",
        produto: {
          id: 1,
          nome: "Bolsa de crochê",
        },
      },
    ],
  };

  const pagamento = {
    id: 5,
    pedido_id: 10,
    provedor: "MERCADO_PAGO",
    status: "PENDENTE",
    valor: "240.00",
    mercado_pago_order_id: null,
    checkout_url: null,
    idempotency_key: null,
  };

  const tentativa = {
    id: 15,
    pagamento_id: 5,
    status: "PENDENTE",
    valor: "240.00",
    mercado_pago_order_id: null,
    checkout_url: null,
    idempotency_key: "chave-idempotencia-teste",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue({
        value: "token-valido",
      }),
    });

    validarSessaoClienteMock.mockResolvedValue(cliente);

    findFirstPedidoMock.mockResolvedValue(pedido);

    findUniquePagamentoMock.mockResolvedValue(null);

    createPagamentoMock.mockResolvedValue(pagamento);

    updatePagamentoMock.mockResolvedValue(pagamento);

    findManyTentativaMock.mockResolvedValue([]);

    createTentativaMock.mockResolvedValue(tentativa);

    updateTentativaMock.mockResolvedValue(tentativa);

    transactionMock.mockImplementation(async (callback) => {
      const tx = {
        tentativa_pagamento: {
          update: updateTentativaMock,
        },

        pagamento: {
          update: updatePagamentoMock,
        },
      };

      return callback(tx);
    });

    criarOrderMercadoPagoMock.mockResolvedValue({
      id: "order-123",
      checkout_url: "https://mercadopago.com/checkout/order-123",
    });

    consultarOrderMercadoPagoMock.mockResolvedValue({
      status: "created",
    });
  });

  function criarRequest() {
    return new Request(
      "http://localhost/api/pedidos/10/checkout",
      {
        method: "POST",
      }
    );
  }

  function criarParams(id = "10") {
    return {
      params: Promise.resolve({ id }),
    };
  }

  // =========================
  // Autenticação
  // =========================

  describe("Autenticação", () => {
    it("deve retornar status 401 quando não houver sessão", async () => {
      cookiesMock.mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      });

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(401);

      expect(dados).toEqual({
        erro: "Entre na sua conta para iniciar o pagamento.",
      });

      expect(validarSessaoClienteMock).not.toHaveBeenCalled();

      expect(findFirstPedidoMock).not.toHaveBeenCalled();
    });

    it("deve retornar status 401 quando a sessão for inválida", async () => {
      validarSessaoClienteMock.mockResolvedValue(null);

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(401);

      expect(dados).toEqual({
        erro: "Sessão inválida ou expirada. Entre novamente.",
      });

      expect(findFirstPedidoMock).not.toHaveBeenCalled();
    });

    it("deve retornar status 500 quando ocorrer um erro na validação da sessão", async () => {
      validarSessaoClienteMock.mockRejectedValue(
        new Error("Erro na sessão")
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(500);

      expect(dados).toEqual({
        erro: "Não foi possível validar a sessão.",
      });

      expect(findFirstPedidoMock).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  // =========================
  // Validação do pedido
  // =========================

  describe("Validação do pedido", () => {
    it("deve retornar status 400 quando o ID do pedido for inválido", async () => {
      const response = await POST(
        criarRequest(),
        criarParams("abc")
      );

      const dados = await response.json();

      expect(response.status).toBe(400);

      expect(dados).toEqual({
        erro: "ID do pedido inválido.",
      });

      expect(findFirstPedidoMock).not.toHaveBeenCalled();
    });

    it("deve retornar status 404 quando o pedido não for encontrado", async () => {
      findFirstPedidoMock.mockResolvedValue(null);

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(404);

      expect(dados).toEqual({
        erro: "Pedido não encontrado.",
      });

      expect(findFirstPedidoMock).toHaveBeenCalledWith({
        where: {
          id: 10,
          cliente_id: 1,
        },
        include: {
          item_pedido: {
            include: {
              produto: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
        },
      });
    });

    it("deve retornar status 409 quando o pedido não estiver pendente", async () => {
      findFirstPedidoMock.mockResolvedValue({
        ...pedido,
        status: "CONFIRMADO",
      });

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(409);

      expect(dados).toEqual({
        erro: "Somente pedidos pendentes podem iniciar o checkout.",
      });

      expect(findUniquePagamentoMock).not.toHaveBeenCalled();
    });

    it("deve retornar status 400 quando o pedido não possuir itens", async () => {
      findFirstPedidoMock.mockResolvedValue({
        ...pedido,
        item_pedido: [],
      });

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(400);

      expect(dados).toEqual({
        erro: "O pedido não possui itens.",
      });

      expect(findUniquePagamentoMock).not.toHaveBeenCalled();
    });
  });

  // =========================
  // Criação do checkout
  // =========================

  describe("Criação do checkout", () => {
    it("deve criar o checkout com status 201", async () => {
      updateTentativaMock.mockResolvedValue({
        ...tentativa,
        mercado_pago_order_id: "order-123",
        checkout_url: "https://mercadopago.com/checkout/order-123",
        status: "PENDENTE",
        valor: "240.00",
      });

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(201);

      expect(dados).toEqual({
        mensagem: "Checkout criado com sucesso.",
        pedido_id: 10,
        pagamento_id: 5,
        tentativa_pagamento_id: 15,
        checkout_url:
          "https://mercadopago.com/checkout/order-123",
      });

      expect(findFirstPedidoMock).toHaveBeenCalledWith({
        where: {
          id: 10,
          cliente_id: 1,
        },
        include: {
          item_pedido: {
            include: {
              produto: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
        },
      });

      expect(createPagamentoMock).toHaveBeenCalledWith({
        data: {
          pedido_id: 10,
          provedor: "MERCADO_PAGO",
          status: "PENDENTE",
          valor: "240.00",
        },
      });

      expect(createTentativaMock).toHaveBeenCalledWith({
        data: {
          pagamento_id: 5,
          status: "PENDENTE",
          valor: "240.00",
          idempotency_key: expect.any(String),
        },
      });

      expect(criarOrderMercadoPagoMock).toHaveBeenCalledWith({
        pedidoId: 10,
        emailCliente: "cliente@example.com",
        itens: pedido.item_pedido,
        valorTotal: "240.00",
        idempotencyKey: expect.any(String),
      });

      expect(transactionMock).toHaveBeenCalled();

      expect(updateTentativaMock).toHaveBeenCalledWith({
        where: {
          id: 15,
        },
        data: {
          mercado_pago_order_id: "order-123",
          checkout_url:
            "https://mercadopago.com/checkout/order-123",
          status: "PENDENTE",
          valor: "240.00",
        },
      });

      expect(updatePagamentoMock).toHaveBeenCalledWith({
        where: {
          id: 5,
        },
        data: {
          mercado_pago_order_id: "order-123",
          checkout_url:
            "https://mercadopago.com/checkout/order-123",
          idempotency_key: expect.any(String),
          status: "PENDENTE",
          valor: "240.00",
        },
      });
    });

    it("deve retornar status 500 quando ocorrer um erro inesperado", async () => {
      findFirstPedidoMock.mockRejectedValue(
        new Error("Erro no banco de dados")
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(500);

      expect(dados).toEqual({
        erro: "Não foi possível iniciar o checkout. Tente novamente.",
      });

      consoleSpy.mockRestore();
    });
  });

  // =========================
  // Recuperação de pagamentos anteriores
  // =========================

  describe("Recuperação de pagamentos anteriores", () => {
    it("deve retornar status 409 quando a ordem legada estiver reembolsada", async () => {
    findUniquePagamentoMock.mockResolvedValue({
      ...pagamento,
      mercado_pago_order_id: "order-legado",
      checkout_url: "https://mercadopago.com/checkout/legado",
      idempotency_key: "chave-legada",
    });

    consultarOrderMercadoPagoMock.mockResolvedValue({
      status: "refunded",
    });

    const response = await POST(
      criarRequest(),
      criarParams()
    );

    const dados = await response.json();

    expect(response.status).toBe(409);

    expect(dados).toEqual({
      erro: "A ordem foi reembolsada. É necessária uma verificação manual.",
    });

    // A rota utiliza pagamento.update diretamente nesse caso legado.
    expect(updatePagamentoMock).toHaveBeenCalledWith({
      where: {
        id: 5,
      },
      data: {
        status: "ESTORNADO",
      },
    });

    expect(transactionMock).not.toHaveBeenCalled();

    expect(criarOrderMercadoPagoMock).not.toHaveBeenCalled();
  });

    it("deve retornar status 409 quando o pagamento já estiver aprovado", async () => {
      findUniquePagamentoMock.mockResolvedValue({
        ...pagamento,
        status: "APROVADO",
      });

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(409);

      expect(dados).toEqual({
        erro: "Este pedido já possui um pagamento aprovado.",
      });

      expect(criarOrderMercadoPagoMock).not.toHaveBeenCalled();
    });

    it("deve recuperar checkout de uma ordem legada ativa", async () => {
      findUniquePagamentoMock.mockResolvedValue({
        ...pagamento,
        mercado_pago_order_id: "order-legado",
        checkout_url: "https://mercadopago.com/checkout/legado",
        idempotency_key: "chave-legada",
      });

      consultarOrderMercadoPagoMock.mockResolvedValue({
        status: "created",
      });

      createTentativaMock.mockResolvedValue({
        ...tentativa,
        mercado_pago_order_id: "order-legado",
        checkout_url: "https://mercadopago.com/checkout/legado",
        idempotency_key: "chave-legada",
      });

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(200);

      expect(dados).toEqual({
        mensagem: "Checkout existente recuperado.",
        pedido_id: 10,
        pagamento_id: 5,
        tentativa_pagamento_id: 15,
        checkout_url: "https://mercadopago.com/checkout/legado",
      });

      expect(consultarOrderMercadoPagoMock).toHaveBeenCalledWith(
        "order-legado"
      );

      expect(criarOrderMercadoPagoMock).not.toHaveBeenCalled();
    });

    it("deve retornar status 409 quando a ordem legada já tiver sido processada", async () => {
      findUniquePagamentoMock.mockResolvedValue({
        ...pagamento,
        mercado_pago_order_id: "order-legado",
        checkout_url: "https://mercadopago.com/checkout/legado",
        idempotency_key: "chave-legada",
      });

      consultarOrderMercadoPagoMock.mockResolvedValue({
        status: "processed",
      });

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(409);

      expect(dados).toEqual({
        erro: "O pagamento foi processado. Verifique o estado do pedido.",
      });

      expect(updatePagamentoMock).toHaveBeenCalledWith({
        where: {
          id: 5,
        },
        data: {
          status: "APROVADO",
        },
      });

      expect(criarOrderMercadoPagoMock).not.toHaveBeenCalled();
    });

    it("deve retornar status 409 quando a ordem legada estiver reembolsada", async () => {
      findUniquePagamentoMock.mockResolvedValue({
        ...pagamento,
        mercado_pago_order_id: "order-legado",
        checkout_url: "https://mercadopago.com/checkout/legado",
        idempotency_key: "chave-legada",
      });

      consultarOrderMercadoPagoMock.mockResolvedValue({
        status: "refunded",
      });

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(409);

      expect(dados).toEqual({
        erro: "A ordem foi reembolsada. É necessária uma verificação manual.",
      });

      expect(updatePagamentoMock).toHaveBeenCalledWith({
        where: {
          id: 5,
        },
        data: {
          status: "ESTORNADO",
        },
      });

      expect(criarOrderMercadoPagoMock).not.toHaveBeenCalled();
      });

    it("deve retornar status 502 quando ocorrer um erro na consulta da ordem legada", async () => {
      findUniquePagamentoMock.mockResolvedValue({
        ...pagamento,
        mercado_pago_order_id: "order-legado",
        checkout_url: "https://mercadopago.com/checkout/legado",
        idempotency_key: "chave-legada",
      });

      consultarOrderMercadoPagoMock.mockRejectedValue(
        new Error("Erro na consulta")
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(502);

      expect(dados).toEqual({
        erro: "Não foi possível verificar o pagamento anterior.",
      });

      expect(criarOrderMercadoPagoMock).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("deve retornar status 409 quando o status da ordem legada for desconhecido", async () => {
      findUniquePagamentoMock.mockResolvedValue({
        ...pagamento,
        mercado_pago_order_id: "order-legado",
        checkout_url: "https://mercadopago.com/checkout/legado",
        idempotency_key: "chave-legada",
      });

      consultarOrderMercadoPagoMock.mockResolvedValue({
        status: "unknown",
      });

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(409);

      expect(dados).toEqual({
        erro: "Não foi possível confirmar o encerramento da ordem anterior.",
      });

      expect(criarOrderMercadoPagoMock).not.toHaveBeenCalled();
    });
  });

  // =========================
  // Tentativas de pagamento existentes
  // =========================

  describe("Tentativas de pagamento existentes", () => {
    it("deve retornar checkout existente quando a tentativa possuir ordem ativa", async () => {
      findUniquePagamentoMock.mockResolvedValue(pagamento);

      findManyTentativaMock.mockResolvedValue([
        {
          ...tentativa,
          mercado_pago_order_id: "order-existente",
          checkout_url: "https://mercadopago.com/checkout/existente",
          idempotency_key: "chave-existente",
        },
      ]);

      consultarOrderMercadoPagoMock.mockResolvedValue({
        status: "processing",
      });

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(200);

      expect(dados).toEqual({
        mensagem: "Checkout já criado para este pedido.",
        pedido_id: 10,
        pagamento_id: 5,
        tentativa_pagamento_id: 15,
        checkout_url: "https://mercadopago.com/checkout/existente",
      });

      expect(criarOrderMercadoPagoMock).not.toHaveBeenCalled();
    });

    it("deve retornar status 409 quando a ordem ativa não possuir checkout disponível", async () => {
      findUniquePagamentoMock.mockResolvedValue(pagamento);

      findManyTentativaMock.mockResolvedValue([
        {
          ...tentativa,
          mercado_pago_order_id: "order-existente",
          checkout_url: null,
          idempotency_key: "chave-existente",
        },
      ]);

      consultarOrderMercadoPagoMock.mockResolvedValue({
        status: "processing",
      });

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(409);

      expect(dados).toEqual({
        erro: "A ordem continua ativa, mas não possui checkout disponível.",
      });

      expect(criarOrderMercadoPagoMock).not.toHaveBeenCalled();
    });

    it("deve retornar status 409 quando a tentativa já tiver sido processada", async () => {
      findUniquePagamentoMock.mockResolvedValue(pagamento);

      findManyTentativaMock.mockResolvedValue([
        {
          ...tentativa,
          mercado_pago_order_id: "order-processada",
          checkout_url: "https://mercadopago.com/checkout/processada",
        },
      ]);

      consultarOrderMercadoPagoMock.mockResolvedValue({
        status: "processed",
      });

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(409);

      expect(dados).toEqual({
        erro: "O pagamento já foi processado.",
      });

      expect(transactionMock).toHaveBeenCalled();

      expect(criarOrderMercadoPagoMock).not.toHaveBeenCalled();
    });

    it("deve retornar status 409 quando a tentativa estiver reembolsada", async () => {
      findUniquePagamentoMock.mockResolvedValue(pagamento);

      findManyTentativaMock.mockResolvedValue([
        {
          ...tentativa,
          mercado_pago_order_id: "order-reembolsada",
          checkout_url: "https://mercadopago.com/checkout/reembolsada",
        },
      ]);

      consultarOrderMercadoPagoMock.mockResolvedValue({
        status: "refunded",
      });

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(409);

      expect(dados).toEqual({
        erro: "O pagamento foi reembolsado. É necessária uma verificação manual.",
      });

      expect(transactionMock).toHaveBeenCalled();

      expect(criarOrderMercadoPagoMock).not.toHaveBeenCalled();
    });

    it("deve retornar status 409 quando o status da tentativa for desconhecido", async () => {
      findUniquePagamentoMock.mockResolvedValue(pagamento);

      findManyTentativaMock.mockResolvedValue([
        {
          ...tentativa,
          mercado_pago_order_id: "order-desconhecida",
          checkout_url: "https://mercadopago.com/checkout/desconhecida",
        },
      ]);

      consultarOrderMercadoPagoMock.mockResolvedValue({
        status: "unknown",
      });

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(409);

      expect(dados).toEqual({
        erro: "Estado da ordem desconhecido. Não será criada outra cobrança.",
      });

      expect(criarOrderMercadoPagoMock).not.toHaveBeenCalled();
    });

    it("deve retornar status 502 quando ocorrer um erro na consulta da tentativa", async () => {
      findUniquePagamentoMock.mockResolvedValue(pagamento);

      findManyTentativaMock.mockResolvedValue([
        {
          ...tentativa,
          mercado_pago_order_id: "order-erro",
          checkout_url: "https://mercadopago.com/checkout/erro",
        },
      ]);

      consultarOrderMercadoPagoMock.mockRejectedValue(
        new Error("Erro na consulta")
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(502);

      expect(dados).toEqual({
        erro: "Não foi possível verificar a tentativa anterior. Tente novamente.",
      });

      expect(criarOrderMercadoPagoMock).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  // =========================
  // Encerramento e idempotência
  // =========================

  describe("Encerramento e idempotência", () => {
    it.each([
      ["failed", "RECUSADO"],
      ["canceled", "CANCELADO"],
      ["expired", "CANCELADO"],
    ])(
      "deve criar novo checkout quando a ordem anterior estiver %s",
      async (statusMercadoPago, statusInterno) => {
        findUniquePagamentoMock.mockResolvedValue(pagamento);

        findManyTentativaMock.mockResolvedValue([
          {
            ...tentativa,
            mercado_pago_order_id: "order-anterior",
            checkout_url: "https://mercadopago.com/checkout/anterior",
            idempotency_key: "chave-anterior",
          },
        ]);

        consultarOrderMercadoPagoMock.mockResolvedValue({
          status: statusMercadoPago,
        });

        updateTentativaMock.mockResolvedValue({
          ...tentativa,
          mercado_pago_order_id: "order-123",
          checkout_url: "https://mercadopago.com/checkout/order-123",
          status: "PENDENTE",
          valor: "240.00",
        });

        const response = await POST(
          criarRequest(),
          criarParams()
        );

        const dados = await response.json();

        expect(response.status).toBe(201);

        expect(dados).toEqual({
          mensagem: "Checkout criado com sucesso.",
          pedido_id: 10,
          pagamento_id: 5,
          tentativa_pagamento_id: 15,
          checkout_url:
            "https://mercadopago.com/checkout/order-123",
        });

        expect(criarOrderMercadoPagoMock).toHaveBeenCalled();

        expect(transactionMock).toHaveBeenCalled();
      }
    );

    it("deve reutilizar a chave de idempotência de uma tentativa pendente sem ordem", async () => {
      findUniquePagamentoMock.mockResolvedValue(pagamento);

      findManyTentativaMock.mockResolvedValue([
        {
          ...tentativa,
          mercado_pago_order_id: null,
          checkout_url: null,
          idempotency_key: "chave-reutilizada",
        },
      ]);

      updateTentativaMock.mockResolvedValue({
        ...tentativa,
        mercado_pago_order_id: "order-123",
        checkout_url: "https://mercadopago.com/checkout/order-123",
      });

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(201);

      expect(dados.checkout_url).toBe(
        "https://mercadopago.com/checkout/order-123"
      );

      expect(createTentativaMock).not.toHaveBeenCalled();

      expect(criarOrderMercadoPagoMock).toHaveBeenCalledWith({
        pedidoId: 10,
        emailCliente: "cliente@example.com",
        itens: pedido.item_pedido,
        valorTotal: "240.00",
        idempotencyKey: "chave-reutilizada",
      });
    });

    it("deve retornar status 502 quando o Mercado Pago não retornar o ID da ordem", async () => {
      criarOrderMercadoPagoMock.mockResolvedValue({
        checkout_url: "https://mercadopago.com/checkout/order-123",
      });

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(502);

      expect(dados).toEqual({
        erro: "O Mercado Pago não retornou os dados do checkout. Tente novamente.",
      });

      expect(transactionMock).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("deve retornar status 502 quando o Mercado Pago não retornar a URL do checkout", async () => {
      criarOrderMercadoPagoMock.mockResolvedValue({
        id: "order-123",
      });

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const response = await POST(
        criarRequest(),
        criarParams()
      );

      const dados = await response.json();

      expect(response.status).toBe(502);

      expect(dados).toEqual({
        erro: "O Mercado Pago não retornou os dados do checkout. Tente novamente.",
      });

      expect(transactionMock).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
