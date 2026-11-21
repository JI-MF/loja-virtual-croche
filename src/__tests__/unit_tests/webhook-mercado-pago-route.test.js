import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { NextRequest } from "next/server";

const {
  validateMock,
  InvalidWebhookSignatureErrorMock,
  consultarOrderMock,
  enviarConfirmacaoMock,
  findUniqueTentativaMock,
  findFirstTentativaMock,
  updateManyTentativaMock,
  findUniquePagamentoMock,
  updateManyPagamentoMock,
  findUniquePedidoMock,
  updatePedidoMock,
  transactionMock,
} = vi.hoisted(() => ({
  validateMock: vi.fn(),

  InvalidWebhookSignatureErrorMock:
    class InvalidWebhookSignatureError extends Error {},

  consultarOrderMock: vi.fn(),
  enviarConfirmacaoMock: vi.fn(),

  findUniqueTentativaMock: vi.fn(),
  findFirstTentativaMock: vi.fn(),
  updateManyTentativaMock: vi.fn(),

  findUniquePagamentoMock: vi.fn(),
  updateManyPagamentoMock: vi.fn(),

  findUniquePedidoMock: vi.fn(),
  updatePedidoMock: vi.fn(),

  transactionMock: vi.fn(),
}));

vi.mock("mercadopago", () => ({
  WebhookSignatureValidator: {
    validate: validateMock,
  },

  InvalidWebhookSignatureError:
    InvalidWebhookSignatureErrorMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tentativa_pagamento: {
      findUnique: findUniqueTentativaMock,
      findFirst: findFirstTentativaMock,
      updateMany: updateManyTentativaMock,
    },

    pagamento: {
      findUnique: findUniquePagamentoMock,
      updateMany: updateManyPagamentoMock,
    },

    pedido: {
      findUnique: findUniquePedidoMock,
      update: updatePedidoMock,
    },

    $transaction: transactionMock,
  },
}));

vi.mock("@/lib/mercado-pago-service", () => ({
  consultarOrderMercadoPago: consultarOrderMock,
}));

vi.mock("@/lib/email-service", () => ({
  enviarConfirmacaoPedido: enviarConfirmacaoMock,
}));

import { POST } from "@/app/api/webhooks/mercado-pago/route";

describe("/api/webhooks/mercado-pago", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubEnv(
      "MERCADO_PAGO_WEBHOOK_SECRET",
      "secret-teste"
    );

    validateMock.mockReturnValue(undefined);

    consultarOrderMock.mockResolvedValue({});
    enviarConfirmacaoMock.mockResolvedValue(undefined);

    transactionMock.mockImplementation(async (callback) => {
      const tx = {
        tentativa_pagamento: {
          findUnique: findUniqueTentativaMock,
          findFirst: findFirstTentativaMock,
          updateMany: updateManyTentativaMock,
        },

        pagamento: {
          findUnique: findUniquePagamentoMock,
          updateMany: updateManyPagamentoMock,
        },

        pedido: {
          findUnique: findUniquePedidoMock,
          update: updatePedidoMock,
        },
      };

      return callback(tx);
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function criarRequest({
    assinatura = "assinatura-valida",
    requestId = "request-123",
    dataId = "order-123",
    tipo = "order",
  } = {}) {
    const url = new URL(
      "http://localhost/api/webhooks/mercado-pago"
    );

    if (dataId !== null) {
      url.searchParams.set("data.id", dataId);
    }

    if (tipo !== null) {
      url.searchParams.set("type", tipo);
    }

    const headers = new Headers();

    if (assinatura !== null) {
      headers.set("x-signature", assinatura);
    }

    if (requestId !== null) {
      headers.set("x-request-id", requestId);
    }

    return new NextRequest(url, {
      method: "POST",
      headers,
    });
  }

  function configurarProcessamentoWebhook({
    statusOrdem = "created",
    statusDetail = "created",
    statusTentativa = "PENDENTE",
    statusPagamento = "PENDENTE",
    statusPedido = "PENDENTE",
    idTentativa = 1,
    idTentativaMaisRecente = 1,
    valor = 100,
    enviarEmail = false,
  } = {}) {
    const ordem = {
      id: "order-123",
      status: statusOrdem,
      status_detail: statusDetail,
      total_amount: valor,
      currency: "BRL",
      external_reference: "pedido-123",
    };

    const tentativa = {
      id: idTentativa,
      mercado_pago_order_id: "order-123",
      valor,
      status: statusTentativa,
      pagamento_id: 1,
      pagamento: {
        id: 1,
        pedido_id: "pedido-123",
        status: statusPagamento,
        pedido: {
          id: "pedido-123",
          status: statusPedido,
        },
      },
    };

    const pedido = {
      id: "pedido-123",
      status: statusPedido,
      email_confirmacao_enviado: false,
      cliente: {
        email: "cliente@teste.com",
      },
      item_pedido: [],
    };

    consultarOrderMock.mockResolvedValue(ordem);

    findUniqueTentativaMock.mockResolvedValue(
      tentativa
    );

    findUniquePagamentoMock.mockResolvedValue({
      id: 1,
      pedido_id: "pedido-123",
      status: statusPagamento,
    });

    findUniquePedidoMock.mockResolvedValue(
      pedido
    );

    findFirstTentativaMock.mockResolvedValue({
      id: idTentativaMaisRecente,
    });

    updateManyTentativaMock.mockResolvedValue({
      count: 1,
    });

    updateManyPagamentoMock.mockResolvedValue({
      count: 1,
    });

    updatePedidoMock.mockResolvedValue(
      pedido
    );

    enviarConfirmacaoMock.mockResolvedValue(
      undefined
    );

    if (enviarEmail) {
      findUniquePedidoMock
        .mockResolvedValueOnce(pedido)
        .mockResolvedValueOnce({
          ...pedido,
          status: "CONFIRMADO",
          email_confirmacao_enviado: false,
        });
    }

    return {
      ordem,
      tentativa,
      pedido,
    };
  }

  // =========================
  // CONFIGURAÇÃO
  // =========================

  describe("Configuração", () => {
    it("deve retornar status 500 quando o secret não estiver configurado", async () => {
      vi.stubEnv(
        "MERCADO_PAGO_WEBHOOK_SECRET",
        ""
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const response = await POST(
        criarRequest()
      );

      const dados = await response.json();

      expect(response.status).toBe(500);

      expect(dados).toEqual({
        erro: "Configuração interna indisponível.",
      });

      expect(validateMock).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  // =========================
  // VALIDAÇÃO DOS HEADERS
  // =========================

  describe("Validação dos headers", () => {
    it.each([
      ["x-signature", null],
      ["x-request-id", null],
      ["data.id", null],
    ])(
      "deve retornar status 400 quando %s estiver ausente",
      async (campo) => {
        const request = criarRequest({
          assinatura:
            campo === "x-signature"
              ? null
              : "assinatura-valida",

          requestId:
            campo === "x-request-id"
              ? null
              : "request-123",

          dataId:
            campo === "data.id"
              ? null
              : "order-123",
        });

        const response = await POST(request);

        const dados = await response.json();

        expect(response.status).toBe(400);

        expect(dados).toEqual({
          erro: "Dados de validação ausentes.",
        });

        expect(validateMock).not.toHaveBeenCalled();
      }
    );
  });

  // =========================
  // VALIDAÇÃO DA ASSINATURA
  // =========================

  describe("Validação da assinatura", () => {
    it("deve retornar status 401 quando a assinatura for inválida", async () => {
      validateMock.mockImplementation(() => {
        throw new InvalidWebhookSignatureErrorMock(
          "Assinatura inválida"
        );
      });

      const response = await POST(
        criarRequest()
      );

      const dados = await response.json();

      expect(response.status).toBe(401);

      expect(dados).toEqual({
        erro: "Assinatura inválida.",
      });

      expect(consultarOrderMock).not.toHaveBeenCalled();
    });

    it("deve retornar status 500 quando ocorrer um erro inesperado na validação", async () => {
      validateMock.mockImplementation(() => {
        throw new Error(
          "Erro inesperado na validação"
        );
      });

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const response = await POST(
        criarRequest()
      );

      const dados = await response.json();

      expect(response.status).toBe(500);

      expect(dados).toEqual({
        erro: "Não foi possível validar a notificação.",
      });

      expect(consultarOrderMock).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("deve validar a assinatura utilizando os dados recebidos", async () => {
      const response = await POST(
        criarRequest({
          dataId: "ORDER-123",
          tipo: "payment",
        })
      );

      expect(validateMock).toHaveBeenCalledWith({
        xSignature: "assinatura-valida",
        xRequestId: "request-123",
        dataId: "order-123",
        secret: "secret-teste",
        toleranceSeconds: 300,
      });

      // A notificação ainda não possui um tipo tratado.
      expect(response.status).toBe(200);
    });
  });

  // =========================
  // TIPO DE NOTIFICAÇÃO
  // =========================

  describe("Tipo de notificação", () => {
    it("deve retornar status 200 quando o tipo não for tratado", async () => {
      const request = criarRequest({
        tipo: "payment",
      });

      const response = await POST(request);

      const dados = await response.json();

      expect(response.status).toBe(200);

      expect(dados).toEqual({
        mensagem: "Tipo de notificação não tratado.",
      });

      expect(consultarOrderMock).not.toHaveBeenCalled();
    });
  });

// =========================
// CONSULTA DA ORDEM
// =========================

  describe("Consulta da ordem", () => {
    it("deve retornar status 500 quando ocorrer um erro ao consultar a ordem no Mercado Pago", async () => {
        consultarOrderMock.mockRejectedValue(
        new Error("Erro ao consultar ordem")
        );

        const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

        const response = await POST(
        criarRequest()
        );

        const dados = await response.json();

        expect(response.status).toBe(500);

        expect(dados).toEqual({
        erro: "Falha ao processar a notificação.",
        });

        expect(consultarOrderMock).toHaveBeenCalledWith(
        "order-123"
        );

        consoleSpy.mockRestore();
    });

    it("deve retornar status 500 quando não encontrar a tentativa de pagamento", async () => {
        consultarOrderMock.mockResolvedValue({
        id: "order-123",
        status: "created",
        status_detail: "created",
        total_amount: 100,
        currency: "BRL",
        external_reference: "pedido-123",
        });

        findUniqueTentativaMock.mockResolvedValue(
        null
        );

        const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

        const response = await POST(
        criarRequest()
        );

        const dados = await response.json();

        expect(response.status).toBe(500);

        expect(dados).toEqual({
        erro: "Tentativa de pagamento não encontrada.",
        });

        expect(consultarOrderMock).toHaveBeenCalledWith(
        "order-123"
        );

        expect(findUniqueTentativaMock).toHaveBeenCalledWith({
        where: {
            mercado_pago_order_id: "order-123",
        },
        include: {
            pagamento: {
            include: {
                pedido: true,
            },
            },
        },
        });

        consoleSpy.mockRestore();
    });
    });  
  // =========================
// VALIDAÇÃO DA INTEGRIDADE DA ORDEM
// =========================

  describe("Validação da integridade da ordem", () => {
    it("deve retornar status 200 quando a referência da ordem não corresponder ao pedido", async () => {
        consultarOrderMock.mockResolvedValue({
        id: "order-123",
        status: "created",
        status_detail: "created",
        total_amount: 100,
        currency: "BRL",
        external_reference: "pedido-999",
        });

        findUniqueTentativaMock.mockResolvedValue({
        valor: 100,
        pagamento: {
            pedido_id: "pedido-123",
            pedido: {},
        },
        });

        const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

        const response = await POST(
        criarRequest()
        );

        const dados = await response.json();

        expect(response.status).toBe(200);

        expect(dados).toEqual({
        mensagem: "Referência não corresponde ao pedido.",
        });

        expect(transactionMock).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    it("deve retornar status 200 quando o valor da ordem for diferente do valor da tentativa", async () => {
        consultarOrderMock.mockResolvedValue({
        id: "order-123",
        status: "created",
        status_detail: "created",
        total_amount: 150,
        currency: "BRL",
        external_reference: "pedido-123",
        });

        findUniqueTentativaMock.mockResolvedValue({
        valor: 100,
        pagamento: {
            pedido_id: "pedido-123",
            pedido: {},
        },
        });

        const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

        const response = await POST(
        criarRequest()
        );

        const dados = await response.json();

        expect(response.status).toBe(200);

        expect(dados).toEqual({
        mensagem: "Dados da ordem precisam ser verificados.",
        });

        expect(transactionMock).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    it("deve retornar status 200 quando a moeda da ordem não for BRL", async () => {
        consultarOrderMock.mockResolvedValue({
        id: "order-123",
        status: "created",
        status_detail: "created",
        total_amount: 100,
        currency: "USD",
        external_reference: "pedido-123",
        });

        findUniqueTentativaMock.mockResolvedValue({
        valor: 100,
        pagamento: {
            pedido_id: "pedido-123",
            pedido: {},
        },
        });

        const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

        const response = await POST(
        criarRequest()
        );

        const dados = await response.json();

        expect(response.status).toBe(200);

        expect(dados).toEqual({
        mensagem: "Dados da ordem precisam ser verificados.",
        });

        expect(transactionMock).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
    });
    });
// =========================
// MAPEAMENTO DOS STATUS
// =========================

  describe("Mapeamento dos status", () => {
    it("deve retornar status 200 quando o status da ordem não for tratado", async () => {
        consultarOrderMock.mockResolvedValue({
        id: "order-123",
        status: "unknown_status",
        status_detail: "unknown",
        total_amount: 100,
        currency: "BRL",
        external_reference: "pedido-123",
        });

        findUniqueTentativaMock.mockResolvedValue({
        valor: 100,
        pagamento: {
            pedido_id: "pedido-123",
            pedido: {},
        },
        });

        const response = await POST(
        criarRequest()
        );

        const dados = await response.json();

        expect(response.status).toBe(200);

        expect(dados).toEqual({
        mensagem: "Status da ordem não tratado.",
        });

        expect(transactionMock).not.toHaveBeenCalled();
    });
    });

    it("deve retornar status 200 quando houver reembolso parcial", async () => {
    consultarOrderMock.mockResolvedValue({
        id: "order-123",
        status: "processed",
        status_detail: "partially_refunded",
        total_amount: 100,
        currency: "BRL",
        external_reference: "pedido-123",
    });

    findUniqueTentativaMock.mockResolvedValue({
        valor: 100,
        pagamento: {
        pedido_id: "pedido-123",
        pedido: {},
        },
    });

    const response = await POST(
        criarRequest()
    );

    const dados = await response.json();

    expect(response.status).toBe(200);

    expect(dados).toEqual({
        mensagem: "Reembolso parcial; atualização requer análise.",
    });

    expect(transactionMock).not.toHaveBeenCalled();
    });

  // =========================
// MAPEAMENTO DOS STATUS
// =========================

  describe("Mapeamento dos status", () => {
    it.each([
      ["created", "PENDENTE"],
      ["processing", "EM_PROCESSAMENTO"],
      ["action_required", "EM_PROCESSAMENTO"],
      ["processed", "APROVADO"],
      ["failed", "RECUSADO"],
      ["canceled", "CANCELADO"],
      ["refunded", "ESTORNADO"],
      ["charged_back", "EM_DISPUTA"],
    ])(
      "deve mapear o status %s para %s",
      async (statusMercadoPago, statusEsperado) => {
        const statusInicial =
          statusEsperado === "ESTORNADO" ||
          statusEsperado === "EM_DISPUTA"
            ? "APROVADO"
            : statusEsperado;

        configurarProcessamentoWebhook({
          statusOrdem: statusMercadoPago,
          statusTentativa: statusInicial,
          statusPagamento: statusInicial,
        });

        const response = await POST(
          criarRequest()
        );

        expect(response.status).toBe(200);

        expect(
          updateManyTentativaMock
        ).toHaveBeenCalledWith({
          where: {
            id: 1,
            status: statusInicial,
          },
          data: {
            status: statusEsperado,
          },
        });
      }
    );
  });

  // =========================
// PROCESSAMENTO DA TRANSAÇÃO
// =========================

  describe("Processamento da transação", () => {
    it("deve atualizar a tentativa e o pagamento quando o status for permitido", async () => {
      configurarProcessamentoWebhook({
        statusOrdem: "processing",
        statusTentativa: "PENDENTE",
        statusPagamento: "PENDENTE",
      });

      const response = await POST(
        criarRequest()
      );

      const dados = await response.json();

      expect(response.status).toBe(200);

      expect(dados).toEqual({
        mensagem: "Notificação processada.",
      });

      expect(
        updateManyTentativaMock
      ).toHaveBeenCalledWith({
        where: {
          id: 1,
          status: "PENDENTE",
        },
        data: {
          status: "EM_PROCESSAMENTO",
        },
      });

      expect(
        updateManyPagamentoMock
      ).toHaveBeenCalledWith({
        where: {
          id: 1,
          status: "PENDENTE",
        },
        data: {
          status: "EM_PROCESSAMENTO",
        },
      });
    });

    it("deve confirmar o pedido quando o pagamento for aprovado e o pedido estiver pendente", async () => {
      configurarProcessamentoWebhook({
        statusOrdem: "processed",
        statusTentativa: "PENDENTE",
        statusPagamento: "PENDENTE",
        statusPedido: "PENDENTE",
      });

      const response = await POST(
        criarRequest()
      );

      expect(response.status).toBe(200);

      expect(updatePedidoMock).toHaveBeenCalledWith({
        where: {
          id: "pedido-123",
        },
        data: {
          status: "CONFIRMADO",
        },
      });
    });

    it("não deve confirmar novamente um pedido que já esteja confirmado", async () => {
      configurarProcessamentoWebhook({
        statusOrdem: "processed",
        statusTentativa: "PENDENTE",
        statusPagamento: "PENDENTE",
        statusPedido: "CONFIRMADO",
      });

      const response = await POST(
        criarRequest()
      );

      expect(response.status).toBe(200);

      expect(updatePedidoMock).not.toHaveBeenCalledWith({
        where: {
          id: "pedido-123",
        },
        data: {
          status: "CONFIRMADO",
        },
      });
    });

    it("deve ignorar uma aprovação quando o pedido estiver cancelado", async () => {
      configurarProcessamentoWebhook({
        statusOrdem: "processed",
        statusTentativa: "PENDENTE",
        statusPagamento: "PENDENTE",
        statusPedido: "CANCELADO",
      });

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const response = await POST(
        criarRequest()
      );

      const dados = await response.json();

      expect(response.status).toBe(200);

      expect(dados).toEqual({
        mensagem: "Notificação processada.",
      });

      expect(
        updateManyTentativaMock
      ).not.toHaveBeenCalled();

      expect(
        updateManyPagamentoMock
      ).not.toHaveBeenCalled();

      expect(updatePedidoMock).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("deve atualizar uma tentativa antiga sem alterar o pagamento principal", async () => {
      configurarProcessamentoWebhook({
        statusOrdem: "processing",
        statusTentativa: "PENDENTE",
        statusPagamento: "PENDENTE",
        idTentativa: 1,
        idTentativaMaisRecente: 2,
      });

      const consoleSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const response = await POST(
        criarRequest()
      );

      expect(response.status).toBe(200);

      expect(
        updateManyTentativaMock
      ).toHaveBeenCalled();

      expect(
        updateManyPagamentoMock
      ).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("deve ignorar a atualização quando o pagamento já possuir o status recebido", async () => {
      configurarProcessamentoWebhook({
        statusOrdem: "processing",
        statusTentativa: "EM_PROCESSAMENTO",
        statusPagamento: "EM_PROCESSAMENTO",
      });

      const response = await POST(
        criarRequest()
      );

      expect(response.status).toBe(200);

      expect(
        updateManyTentativaMock
      ).toHaveBeenCalled();

      expect(
        updateManyPagamentoMock
      ).not.toHaveBeenCalled();
    });

    it("deve ignorar uma transição inválida da tentativa", async () => {
      configurarProcessamentoWebhook({
        statusOrdem: "processed",
        statusTentativa: "RECUSADO",
        statusPagamento: "RECUSADO",
      });

      const consoleSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const response = await POST(
        criarRequest()
      );

      expect(response.status).toBe(200);

      expect(
        updateManyTentativaMock
      ).not.toHaveBeenCalled();

      expect(
        updateManyPagamentoMock
      ).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("deve ignorar uma transição inválida do pagamento principal", async () => {
      configurarProcessamentoWebhook({
        statusOrdem: "processed",
        statusTentativa: "PENDENTE",
        statusPagamento: "RECUSADO",
      });

      const consoleSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const response = await POST(
        criarRequest()
      );

      expect(response.status).toBe(200);

      expect(
        updateManyTentativaMock
      ).toHaveBeenCalled();

      expect(
        updateManyPagamentoMock
      ).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("deve retornar status 500 quando ocorrer conflito na atualização da tentativa", async () => {
      configurarProcessamentoWebhook({
        statusOrdem: "processing",
        statusTentativa: "PENDENTE",
        statusPagamento: "PENDENTE",
      });

      updateManyTentativaMock.mockResolvedValue({
        count: 0,
      });

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const response = await POST(
        criarRequest()
      );

      const dados = await response.json();

      expect(response.status).toBe(500);

      expect(dados).toEqual({
        erro: "Falha ao processar a notificação.",
      });

      consoleSpy.mockRestore();
    });

    it("deve retornar status 500 quando ocorrer conflito na atualização do pagamento", async () => {
      configurarProcessamentoWebhook({
        statusOrdem: "processing",
        statusTentativa: "PENDENTE",
        statusPagamento: "PENDENTE",
      });

      updateManyPagamentoMock.mockResolvedValue({
        count: 0,
      });

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const response = await POST(
        criarRequest()
      );

      const dados = await response.json();

      expect(response.status).toBe(500);

      expect(dados).toEqual({
        erro: "Falha ao processar a notificação.",
      });

      consoleSpy.mockRestore();
    });
  });

  // =========================
// ENVIO DE E-MAIL
// =========================

  describe("Envio de e-mail", () => {
    it("deve enviar o e-mail de confirmação quando o pagamento for aprovado", async () => {
      configurarProcessamentoWebhook({
        statusOrdem: "processed",
        statusTentativa: "PENDENTE",
        statusPagamento: "PENDENTE",
        statusPedido: "PENDENTE",
        enviarEmail: true,
      });

      const response = await POST(
        criarRequest()
      );

      expect(response.status).toBe(200);

      expect(
        enviarConfirmacaoMock
      ).toHaveBeenCalledWith(
        "cliente@teste.com",
        expect.objectContaining({
          id: "pedido-123",
          status: "CONFIRMADO",
        })
      );

      expect(updatePedidoMock).toHaveBeenCalledWith({
        where: {
          id: "pedido-123",
        },
        data: {
          email_confirmacao_enviado: true,
        },
      });
    });

    it("não deve enviar o e-mail quando a confirmação já tiver sido enviada", async () => {
      configurarProcessamentoWebhook({
        statusOrdem: "processed",
        statusTentativa: "PENDENTE",
        statusPagamento: "PENDENTE",
        statusPedido: "PENDENTE",
      });

      findUniquePedidoMock
        .mockResolvedValueOnce({
          id: "pedido-123",
          status: "PENDENTE",
        })
        .mockResolvedValueOnce({
          id: "pedido-123",
          status: "CONFIRMADO",
          email_confirmacao_enviado: true,
          cliente: {
            email: "cliente@teste.com",
          },
          item_pedido: [],
        });

      const response = await POST(
        criarRequest()
      );

      expect(response.status).toBe(200);

      expect(
        enviarConfirmacaoMock
      ).not.toHaveBeenCalled();
    });

    it("não deve enviar o e-mail quando o pedido não estiver confirmado", async () => {
      configurarProcessamentoWebhook({
        statusOrdem: "processed",
        statusTentativa: "PENDENTE",
        statusPagamento: "PENDENTE",
        statusPedido: "PENDENTE",
      });

      findUniquePedidoMock
        .mockResolvedValueOnce({
          id: "pedido-123",
          status: "PENDENTE",
        })
        .mockResolvedValueOnce({
          id: "pedido-123",
          status: "PENDENTE",
          email_confirmacao_enviado: false,
          cliente: {
            email: "cliente@teste.com",
          },
          item_pedido: [],
        });

      const response = await POST(
        criarRequest()
      );

      expect(response.status).toBe(200);

      expect(
        enviarConfirmacaoMock
      ).not.toHaveBeenCalled();
    });

    it("deve retornar status 500 quando ocorrer erro ao enviar o e-mail", async () => {
      configurarProcessamentoWebhook({
        statusOrdem: "processed",
        statusTentativa: "PENDENTE",
        statusPagamento: "PENDENTE",
        statusPedido: "PENDENTE",
        enviarEmail: true,
      });

      enviarConfirmacaoMock.mockRejectedValue(
        new Error("Erro no envio do e-mail")
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const response = await POST(
        criarRequest()
      );

      const dados = await response.json();

      expect(response.status).toBe(500);

      expect(dados).toEqual({
        erro: "Falha ao processar a notificação.",
      });

      consoleSpy.mockRestore();
    });
  });

  // =========================
// REGISTROS AUSENTES
// =========================

  describe("Registros ausentes na transação", () => {
    it("deve retornar status 500 quando a tentativa não existir durante a transação", async () => {
      configurarProcessamentoWebhook();

      findUniqueTentativaMock
        .mockResolvedValueOnce({
          id: 1,
          valor: 100,
          pagamento: {
            id: 1,
            pedido_id: "pedido-123",
            pedido: {},
          },
        })
        .mockResolvedValueOnce(null);

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const response = await POST(
        criarRequest()
      );

      const dados = await response.json();

      expect(response.status).toBe(500);

      expect(dados).toEqual({
        erro: "Falha ao processar a notificação.",
      });

      consoleSpy.mockRestore();
    });

    it("deve retornar status 500 quando o pagamento não existir durante a transação", async () => {
      configurarProcessamentoWebhook();

      findUniquePagamentoMock.mockResolvedValueOnce(
        null
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const response = await POST(
        criarRequest()
      );

      const dados = await response.json();

      expect(response.status).toBe(500);

      expect(dados).toEqual({
        erro: "Falha ao processar a notificação.",
      });

      consoleSpy.mockRestore();
    });

    it("deve retornar status 500 quando o pedido não existir durante a transação", async () => {
      configurarProcessamentoWebhook();

      findUniquePedidoMock.mockResolvedValueOnce(
        null
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const response = await POST(
        criarRequest()
      );

      const dados = await response.json();

      expect(response.status).toBe(500);

      expect(dados).toEqual({
        erro: "Falha ao processar a notificação.",
      });

      consoleSpy.mockRestore();
    });
  });
});
