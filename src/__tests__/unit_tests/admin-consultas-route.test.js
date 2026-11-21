
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  exigirAdminMock,
  transactionMock,
  contatoFindMany,
  contatoCount,
  pedidoFindMany,
  pedidoCount,
  pedidoFindUnique,
  pedidoUpdateMany,
  pagamentoAggregate,
  pedidoGroupBy,
  pagamentoFindMany,
} = vi.hoisted(() => ({
  exigirAdminMock: vi.fn(),
  transactionMock: vi.fn(),
  contatoFindMany: vi.fn(),
  contatoCount: vi.fn(),
  pedidoFindMany: vi.fn(),
  pedidoCount: vi.fn(),
  pedidoFindUnique: vi.fn(),
  pedidoUpdateMany: vi.fn(),
  pagamentoAggregate: vi.fn(),
  pedidoGroupBy: vi.fn(),
  pagamentoFindMany: vi.fn(),
}));

vi.mock("@/lib/admin-auth-guard", () => ({
  exigirAdmin: exigirAdminMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: transactionMock,

    contato: {
      findMany: contatoFindMany,
      count: contatoCount,
    },

    pedido: {
      findMany: pedidoFindMany,
      count: pedidoCount,
      findUnique: pedidoFindUnique,
      updateMany: pedidoUpdateMany,
      groupBy: pedidoGroupBy,
    },

    pagamento: {
      aggregate: pagamentoAggregate,
      findMany: pagamentoFindMany,
    },
  },
}));

import { GET as leadsGET } from "@/app/api/admin/leads/route";

import { GET as pedidosGET } from "@/app/api/admin/pedidos/route";

import {
  GET as pedidoDetalheGET,
  PATCH as pedidoPATCH,
} from "@/app/api/admin/pedidos/[id]/route";

import { GET as dashboardGET } from "@/app/api/admin/dashboard/route";

const criarRequest = (path) =>
  new Request(`http://localhost${path}`);

describe("consultas administrativas", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    exigirAdminMock.mockResolvedValue({
      admin: { id: 1 },
      resposta: null,
    });

    transactionMock.mockResolvedValue([[], 0]);

    contatoFindMany.mockResolvedValue([]);
    contatoCount.mockResolvedValue(0);

    pedidoFindMany.mockResolvedValue([]);
    pedidoCount.mockResolvedValue(0);

    pedidoFindUnique.mockResolvedValue({
      id: 9,
      status: "PENDENTE",
    });

    pedidoUpdateMany.mockResolvedValue({
      count: 1,
    });

    pagamentoAggregate.mockResolvedValue({
      _sum: {
        valor: null,
      },
    });

    pedidoGroupBy.mockResolvedValue([]);

    pagamentoFindMany.mockResolvedValue([]);
  });

  // LEADS

  it("bloqueia a consulta de leads sem administrador autenticado", async () => {
    exigirAdminMock.mockResolvedValue({
      resposta: Response.json(
        { mensagem: "Não autorizado." },
        { status: 401 }
      ),
    });

    const response = await leadsGET(
      criarRequest("/api/admin/leads")
    );

    expect(response.status).toBe(401);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("lista leads com paginação padrão", async () => {
    transactionMock.mockResolvedValue([
      [{ id: 1, nome: "Ana" }],
      1,
    ]);

    const response = await leadsGET(
      criarRequest("/api/admin/leads")
    );

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body).toMatchObject({
      total: 1,
      pagina: 1,
      limite: 10,
      totalPaginas: 1,
      leads: [{ id: 1, nome: "Ana" }],
    });
  });

  it("aplica busca e filtro de e-mail verificado", async () => {
    const response = await leadsGET(
      criarRequest(
        "/api/admin/leads?busca=ana&verificado=true&pagina=2&limite=5"
      )
    );

    expect(response.status).toBe(200);

    expect(contatoFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          email_verificado: true,
          OR: expect.any(Array),
        }),
        skip: 5,
        take: 5,
      })
    );
  });

  it.each([
    "pagina=0",
    "pagina=1.5",
    "limite=0",
    "limite=101",
  ])("rejeita paginação inválida: %s", async (query) => {
    const response = await leadsGET(
      criarRequest(`/api/admin/leads?${query}`)
    );

    expect(response.status).toBe(400);
  });

  it("rejeita valor inválido no filtro de verificação", async () => {
    const response = await leadsGET(
      criarRequest("/api/admin/leads?verificado=sim")
    );

    expect(response.status).toBe(400);
  });

  it("retorna 500 quando a consulta de leads falha", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    transactionMock.mockRejectedValue(new Error("Erro no banco"));

    const response = await leadsGET(
      criarRequest("/api/admin/leads")
    );

    expect(response.status).toBe(500);

    spy.mockRestore();
  });

  // PEDIDOS

  it("lista pedidos com paginação padrão", async () => {
    transactionMock.mockResolvedValue([
      [{ id: 3, status: "PENDENTE" }],
      1,
    ]);

    const response = await pedidosGET(
      criarRequest("/api/admin/pedidos")
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.pedidos).toEqual([
      { id: 3, status: "PENDENTE" },
    ]);
    expect(body.totalPaginas).toBe(1);
  });

  it("rejeita status de pedido inválido", async () => {
    const response = await pedidosGET(
      criarRequest("/api/admin/pedidos?status=INVALIDO")
    );

    expect(response.status).toBe(400);
  });

  it("rejeita status de pagamento inválido", async () => {
    const response = await pedidosGET(
      criarRequest(
        "/api/admin/pedidos?statusPagamento=INVALIDO"
      )
    );

    expect(response.status).toBe(400);
  });

  it("rejeita limite acima de 100", async () => {
    const response = await pedidosGET(
      criarRequest("/api/admin/pedidos?limite=101")
    );

    expect(response.status).toBe(400);
  });

  it.each([
    "pagina=0",
    "pagina=-1",
    "pagina=1.5",
    "limite=0",
    "limite=-1",
    "limite=1.5",
  ])("rejeita paginação inválida: %s", async (query) => {
    const response = await pedidosGET(
      criarRequest(`/api/admin/pedidos?${query}`)
    );

    expect(response.status).toBe(400);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("bloqueia consulta sem administrador autenticado", async () => {
    exigirAdminMock.mockResolvedValue({
      resposta: Response.json(
        { mensagem: "Não autorizado." },
        { status: 401 }
      ),
    });

    const response = await pedidosGET(
      criarRequest("/api/admin/pedidos")
    );

    expect(response.status).toBe(401);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("aplica filtros de status do pedido e pagamento", async () => {
    const response = await pedidosGET(
      criarRequest(
        "/api/admin/pedidos?status=CONFIRMADO&statusPagamento=APROVADO"
      )
    );

    expect(response.status).toBe(200);

    expect(pedidoFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: "CONFIRMADO",
          pagamento: {
            some: {
              status: "APROVADO",
            },
          },
        },
      })
    );

    expect(pedidoCount).toHaveBeenCalledWith({
      where: {
        status: "CONFIRMADO",
        pagamento: {
          some: {
            status: "APROVADO",
          },
        },
      },
    });
  });

  it("busca pedidos pelo nome ou email do cliente", async () => {
    const response = await pedidosGET(
      criarRequest(
        "/api/admin/pedidos?busca=cliente"
      )
    );

    expect(response.status).toBe(200);

    expect(pedidoFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            {
              cliente: {
                is: {
                  nome: {
                    contains: "cliente",
                  },
                },
              },
            },
            {
              cliente: {
                is: {
                  email: {
                    contains: "cliente",
                  },
                },
              },
            },
          ],
        },
      })
    );
  });

  it("busca pedidos pelo ID quando o termo é numérico", async () => {
    const response = await pedidosGET(
      criarRequest("/api/admin/pedidos?busca=123")
    );

    expect(response.status).toBe(200);

    expect(pedidoFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            {
              cliente: {
                is: {
                  nome: {
                    contains: "123",
                  },
                },
              },
            },
            {
              cliente: {
                is: {
                  email: {
                    contains: "123",
                  },
                },
              },
            },
            {
              id: 123,
            },
          ],
        },
      })
    );
  });

  it("calcula corretamente o total de páginas", async () => {
    transactionMock.mockResolvedValue([
      [],
      25,
    ]);

    const response = await pedidosGET(
      criarRequest("/api/admin/pedidos?pagina=2&limite=10")
    );

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body).toEqual({
      total: 25,
      pagina: 2,
      limite: 10,
      totalPaginas: 3,
      pedidos: [],
    });
  });

  it("aplica corretamente os parâmetros de paginação na consulta", async () => {
    const response = await pedidosGET(
      criarRequest("/api/admin/pedidos?pagina=3&limite=5")
    );

    expect(response.status).toBe(200);

    expect(pedidoFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 5,
        orderBy: {
          data_pedido: "desc",
        },
      })
    );
  });

  it("retorna 500 quando a consulta de pedidos falha", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    transactionMock.mockRejectedValue(new Error("Erro no banco"));

    const response = await pedidosGET(
      criarRequest("/api/admin/pedidos")
    );

    expect(response.status).toBe(500);

    spy.mockRestore();
  });

  // DETALHES DO PEDIDO

  it("consulta os detalhes de um pedido", async () => {
    pedidoFindUnique.mockResolvedValue({
      id: 9,
      status: "PENDENTE",
      cliente: {},
      item_pedido: [],
      pagamento: [],
    });

    const response = await pedidoDetalheGET(
      criarRequest("/api/admin/pedidos/9"),
      {
        params: Promise.resolve({ id: "9" }),
      }
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.pedido.id).toBe(9);
    expect(body.proximosStatus).toEqual([
      "CONFIRMADO",
      "CANCELADO",
    ]);
  });

  it("rejeita ID inválido nos detalhes do pedido", async () => {
    const response = await pedidoDetalheGET(
      criarRequest("/api/admin/pedidos/abc"),
      {
        params: Promise.resolve({ id: "abc" }),
      }
    );

    expect(response.status).toBe(400);
  });

  it("retorna 404 quando o pedido não existe", async () => {
    pedidoFindUnique.mockResolvedValue(null);

    const response = await pedidoDetalheGET(
      criarRequest("/api/admin/pedidos/88"),
      {
        params: Promise.resolve({ id: "88" }),
      }
    );

    expect(response.status).toBe(404);
  });

  // ATUALIZAÇÃO DO STATUS

  it("atualiza o status do pedido para CONFIRMADO", async () => {
    const request = new Request(
      "http://localhost/api/admin/pedidos/9",
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          status: "CONFIRMADO",
        }),
      }
    );

    const response = await pedidoPATCH(request, {
      params: Promise.resolve({ id: "9" }),
    });

    expect(response.status).toBe(200);

    expect(pedidoUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 9,
        status: "PENDENTE",
      },
      data: {
        status: "CONFIRMADO",
      },
    });
  });

  it("rejeita status inválido", async () => {
    const request = new Request(
      "http://localhost/api/admin/pedidos/9",
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          status: "INVALIDO",
        }),
      }
    );

    const response = await pedidoPATCH(request, {
      params: Promise.resolve({ id: "9" }),
    });

    expect(response.status).toBe(400);
  });

  it("rejeita transição de status não permitida", async () => {
    pedidoFindUnique.mockResolvedValue({
      id: 9,
      status: "PENDENTE",
    });

    const request = new Request(
      "http://localhost/api/admin/pedidos/9",
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          status: "ENTREGUE",
        }),
      }
    );

    const response = await pedidoPATCH(request, {
      params: Promise.resolve({ id: "9" }),
    });

    expect(response.status).toBe(400);
    expect(pedidoUpdateMany).not.toHaveBeenCalled();
  });

  it("retorna 409 quando o pedido foi alterado simultaneamente", async () => {
    pedidoUpdateMany.mockResolvedValue({
      count: 0,
    });

    const request = new Request(
      "http://localhost/api/admin/pedidos/9",
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          status: "CONFIRMADO",
        }),
      }
    );

    const response = await pedidoPATCH(request, {
      params: Promise.resolve({ id: "9" }),
    });

    expect(response.status).toBe(409);
  });

  // DASHBOARD

  it("retorna indicadores do dashboard sem pagamentos", async () => {
    pedidoCount
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(4);

    contatoCount.mockResolvedValue(6);

    pagamentoAggregate.mockResolvedValue({
      _sum: {
        valor: null,
      },
    });

    pedidoGroupBy.mockResolvedValue([
      {
        status: "PENDENTE",
        _count: {
          _all: 2,
        },
      },
    ]);

    pagamentoFindMany.mockResolvedValue([]);

    const response = await dashboardGET();

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body.indicadores).toMatchObject({
      totalPedidos: 4,
      pedidosPendentes: 4,
      totalLeads: 6,
      faturamentoTotal: 0,
    });

    expect(body.vendasPorMes).toHaveLength(6);

    expect(body.pedidosPorStatus).toEqual([
      {
        status: "PENDENTE",
        quantidade: 2,
      },
    ]);
  });

  it("retorna 500 quando o dashboard falha ao consultar o banco", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    pedidoCount.mockRejectedValue(new Error("Erro no banco"));

    const response = await dashboardGET();

    expect(response.status).toBe(500);

    spy.mockRestore();
  });

  it("bloqueia o dashboard sem administrador autenticado", async () => {
    exigirAdminMock.mockResolvedValue({
      resposta: Response.json(
        { mensagem: "Não autorizado." },
        { status: 401 }
      ),
    });

    const response = await dashboardGET();

    expect(response.status).toBe(401);

    expect(pedidoCount).not.toHaveBeenCalled();
    expect(contatoCount).not.toHaveBeenCalled();
    expect(pagamentoAggregate).not.toHaveBeenCalled();
    expect(pedidoGroupBy).not.toHaveBeenCalled();
    expect(pagamentoFindMany).not.toHaveBeenCalled();
  });

  it("calcula o faturamento e distribui as vendas por mês", async () => {
    const agora = new Date();

    const pagamentoMesAtual = {
      valor: 150.50,
      pedido: {
        data_pedido: new Date(
          agora.getFullYear(),
          agora.getMonth(),
          10
        ),
      },
    };

    const pagamentoMesAnterior = {
      valor: 200.75,
      pedido: {
        data_pedido: new Date(
          agora.getFullYear(),
          agora.getMonth() - 1,
          15
        ),
      },
    };

    pedidoCount
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3);

    contatoCount.mockResolvedValue(8);

    pagamentoAggregate.mockResolvedValue({
      _sum: {
        valor: 351.25,
      },
    });

    pedidoGroupBy.mockResolvedValue([
      {
        status: "PENDENTE",
        _count: {
          _all: 3,
        },
      },
      {
        status: "CONFIRMADO",
        _count: {
          _all: 5,
        },
      },
      {
        status: "CANCELADO",
        _count: {
          _all: 2,
        },
      },
    ]);

    pagamentoFindMany.mockResolvedValue([
      pagamentoMesAtual,
      pagamentoMesAnterior,
    ]);

    const response = await dashboardGET();

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body.indicadores).toEqual({
      totalPedidos: 10,
      pedidosPendentes: 3,
      totalLeads: 8,
      faturamentoTotal: 351.25,
    });

    expect(body.vendasPorMes).toHaveLength(6);

    const mesesComVendas = body.vendasPorMes.filter(
      (item) => item.total > 0
    );

    expect(mesesComVendas).toHaveLength(2);

    expect(mesesComVendas.map((item) => item.total)).toEqual([
      200.75,
      150.5,
    ]);

    expect(body.pedidosPorStatus).toEqual([
      {
        status: "PENDENTE",
        quantidade: 3,
      },
      {
        status: "CONFIRMADO",
        quantidade: 5,
      },
      {
        status: "CANCELADO",
        quantidade: 2,
      },
    ]);
  });

  it("não contabiliza pagamentos fora do período de seis meses", async () => {
    const agora = new Date();

    const pagamentoAntigo = {
      valor: 500,
      pedido: {
        data_pedido: new Date(
          agora.getFullYear(),
          agora.getMonth() - 6,
          15
        ),
      },
    };

    pagamentoFindMany.mockResolvedValue([
      pagamentoAntigo,
    ]);

    const response = await dashboardGET();

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body.vendasPorMes).toHaveLength(6);

    expect(
      body.vendasPorMes.every(
        (item) => item.total === 0
      )
    ).toBe(true);
  });
});
