
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  cookiesMock,
  validarSessaoClienteMock,
  findManyPedidoMock,
  findManyProdutoMock,
  updateManyProdutoMock,
  createPedidoMock,
  transactionMock,
} = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  validarSessaoClienteMock: vi.fn(),
  findManyPedidoMock: vi.fn(),
  findManyProdutoMock: vi.fn(),
  updateManyProdutoMock: vi.fn(),
  createPedidoMock: vi.fn(),
  transactionMock: vi.fn(),
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
      findMany: findManyPedidoMock,
      create: createPedidoMock,
    },
    produto: {
      findMany: findManyProdutoMock,
      updateMany: updateManyProdutoMock,
    },
    $transaction: transactionMock,
  },
}));

import { GET, POST } from "@/app/api/pedidos/route";

describe("/api/pedidos", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue({
        value: "token-valido",
      }),
    });

    validarSessaoClienteMock.mockResolvedValue({
      id: 1,
      nome: "Cliente Teste",
      email: "cliente@example.com",
    });

    transactionMock.mockImplementation(async (callback) => {
      const tx = {
        produto: {
          findMany: findManyProdutoMock,
          updateMany: updateManyProdutoMock,
        },
        pedido: {
          create: createPedidoMock,
        },
      };

      return callback(tx);
    });
  });

  // =========================
  // GET /api/pedidos
  // =========================

  describe("GET /api/pedidos", () => {
    it("deve retornar status 401 quando não houver sessão", async () => {
      cookiesMock.mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      });

      const response = await GET();
      const dados = await response.json();

      expect(response.status).toBe(401);

      expect(dados).toEqual({
        erro: "É necessário estar autenticado para consultar os pedidos.",
      });

      expect(validarSessaoClienteMock).not.toHaveBeenCalled();
      expect(findManyPedidoMock).not.toHaveBeenCalled();
    });

    it("deve retornar status 401 quando a sessão for inválida", async () => {
      validarSessaoClienteMock.mockResolvedValue(null);

      const response = await GET();
      const dados = await response.json();

      expect(response.status).toBe(401);

      expect(dados).toEqual({
        erro: "Sessão inválida ou expirada. Entre novamente.",
      });
    });

    it("deve retornar os pedidos do cliente autenticado com status 200", async () => {
      const pedidos = [
        {
          id: 1,
          cliente_id: 1,
          status: "PENDENTE",
          valor_total: "120.00",
          item_pedido: [],
          pagamento: null,
        },
      ];

      findManyPedidoMock.mockResolvedValue(pedidos);

      const response = await GET();
      const dados = await response.json();

      expect(response.status).toBe(200);

      expect(dados).toEqual({
        mensagem: "Pedidos consultados com sucesso.",
        pedidos,
      });

      expect(findManyPedidoMock).toHaveBeenCalledWith({
        where: {
          cliente_id: 1,
        },
        orderBy: {
          data_pedido: "desc",
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
          pagamento: true,
        },
      });
    });

    it("deve retornar status 500 quando ocorrer um erro na validação da sessão", async () => {
      validarSessaoClienteMock.mockRejectedValue(
        new Error("Erro na sessão")
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const response = await GET();
      const dados = await response.json();

      expect(response.status).toBe(500);

      expect(dados).toEqual({
        erro: "Não foi possível validar a sessão.",
      });

      consoleSpy.mockRestore();
    });

    it("deve retornar status 500 quando ocorrer um erro na consulta", async () => {
      findManyPedidoMock.mockRejectedValue(
        new Error("Erro no banco de dados")
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const response = await GET();
      const dados = await response.json();

      expect(response.status).toBe(500);

      expect(dados).toEqual({
        erro: "Não foi possível consultar os pedidos.",
      });

      consoleSpy.mockRestore();
    });
  });

  // =========================
  // POST /api/pedidos
  // =========================

  describe("POST /api/pedidos", () => {
    it("deve retornar status 401 quando não houver sessão", async () => {
      cookiesMock.mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      });

      const request = new Request("http://localhost/api/pedidos", {
        method: "POST",
        body: JSON.stringify({
          itens: [{ produto_id: 1, quantidade: 1 }],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const dados = await response.json();

      expect(response.status).toBe(401);

      expect(dados).toEqual({
        erro: "É necessário estar autenticado para criar um pedido.",
      });
    });

    it("deve retornar status 401 quando a sessão for inválida", async () => {
      validarSessaoClienteMock.mockResolvedValue(null);

      const request = new Request("http://localhost/api/pedidos", {
        method: "POST",
        body: JSON.stringify({
          itens: [{ produto_id: 1, quantidade: 1 }],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const dados = await response.json();

      expect(response.status).toBe(401);

      expect(dados).toEqual({
        erro: "Sessão inválida ou expirada. Entre novamente.",
      });
    });

    it("deve retornar status 400 quando o JSON for inválido", async () => {
      const request = new Request("http://localhost/api/pedidos", {
        method: "POST",
        body: "json-invalido",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const dados = await response.json();

      expect(response.status).toBe(400);

      expect(dados).toEqual({
        erro: "O corpo da requisição deve conter um JSON válido.",
      });
    });

    it("deve retornar status 400 quando os itens forem inválidos", async () => {
      const request = new Request("http://localhost/api/pedidos", {
        method: "POST",
        body: JSON.stringify({
          itens: [],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const dados = await response.json();

      expect(response.status).toBe(400);

      expect(dados).toEqual({
        erro: "Informe entre 1 e 50 itens no pedido.",
      });
    });

    it("deve retornar status 400 quando o produto_id ou quantidade forem inválidos", async () => {
      const request = new Request("http://localhost/api/pedidos", {
        method: "POST",
        body: JSON.stringify({
          itens: [
            {
              produto_id: 1,
              quantidade: 0,
            },
          ],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const dados = await response.json();

      expect(response.status).toBe(400);

      expect(dados).toEqual({
        erro: "Cada item deve possuir um produto_id e uma quantidade válidos.",
      });

      expect(transactionMock).not.toHaveBeenCalled();
    });

    it("deve retornar status 400 quando um produto não for encontrado", async () => {
      findManyProdutoMock.mockResolvedValue([]);

      const request = new Request("http://localhost/api/pedidos", {
        method: "POST",
        body: JSON.stringify({
          itens: [{ produto_id: 1, quantidade: 1 }],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const dados = await response.json();

      expect(response.status).toBe(400);

      expect(dados).toEqual({
        erro: "Um ou mais produtos não foram encontrados.",
      });

      expect(createPedidoMock).not.toHaveBeenCalled();
    });

    it("deve retornar status 409 quando não houver estoque suficiente", async () => {
      findManyProdutoMock.mockResolvedValue([
        {
          id: 1,
          nome: "Bolsa de crochê",
          preco: "120.00",
          estoque: 1,
        },
      ]);

      const request = new Request("http://localhost/api/pedidos", {
        method: "POST",
        body: JSON.stringify({
          itens: [{ produto_id: 1, quantidade: 2 }],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const dados = await response.json();

      expect(response.status).toBe(409);

      expect(dados).toEqual({
        erro: "Estoque insuficiente para o produto: Bolsa de crochê.",
      });

      expect(updateManyProdutoMock).not.toHaveBeenCalled();
      expect(createPedidoMock).not.toHaveBeenCalled();
    });

    it("deve retornar status 409 quando a atualização do estoque falhar", async () => {
      findManyProdutoMock.mockResolvedValue([
        {
          id: 1,
          nome: "Bolsa de crochê",
          preco: "120.00",
          estoque: 5,
        },
      ]);

      updateManyProdutoMock.mockResolvedValue({
        count: 0,
      });

      const request = new Request("http://localhost/api/pedidos", {
        method: "POST",
        body: JSON.stringify({
          itens: [{ produto_id: 1, quantidade: 2 }],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const dados = await response.json();

      expect(response.status).toBe(409);

      expect(dados).toEqual({
        erro: "Estoque insuficiente. Atualize o carrinho e tente novamente.",
      });

      expect(createPedidoMock).not.toHaveBeenCalled();
    });

    it("deve criar o pedido com status 201 e atualizar o estoque", async () => {
      const pedidoCriado = {
        id: 10,
        cliente_id: 1,
        status: "PENDENTE",
        valor_total: "240.00",
        item_pedido: [
          {
            produto_id: 1,
            quantidade: 2,
            preco_unitario: "120.00",
          },
        ],
      };

      findManyProdutoMock.mockResolvedValue([
        {
          id: 1,
          nome: "Bolsa de crochê",
          preco: "120.00",
          estoque: 5,
        },
      ]);

      updateManyProdutoMock.mockResolvedValue({
        count: 1,
      });

      createPedidoMock.mockResolvedValue(pedidoCriado);

      const request = new Request("http://localhost/api/pedidos", {
        method: "POST",
        body: JSON.stringify({
          itens: [{ produto_id: 1, quantidade: 2 }],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const dados = await response.json();

      expect(response.status).toBe(201);

      expect(dados).toEqual({
        mensagem: "Pedido criado com sucesso.",
        pedido: pedidoCriado,
      });

      expect(findManyProdutoMock).toHaveBeenCalledWith({
        where: {
          id: {
            in: [1],
          },
        },
      });

      expect(updateManyProdutoMock).toHaveBeenCalledWith({
        where: {
          id: 1,
          estoque: {
            gte: 2,
          },
        },
        data: {
          estoque: {
            decrement: 2,
          },
        },
      });

      expect(createPedidoMock).toHaveBeenCalledWith({
        data: {
          cliente_id: 1,
          status: "PENDENTE",
          valor_total: "240.00",
          item_pedido: {
            create: [
              {
                produto_id: 1,
                quantidade: 2,
                preco_unitario: "120.00",
              },
            ],
          },
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

    it("deve agrupar itens repetidos do mesmo produto", async () => {
      findManyProdutoMock.mockResolvedValue([
        {
          id: 1,
          nome: "Bolsa de crochê",
          preco: "120.00",
          estoque: 10,
        },
      ]);

      updateManyProdutoMock.mockResolvedValue({
        count: 1,
      });

      createPedidoMock.mockResolvedValue({
        id: 11,
        cliente_id: 1,
        status: "PENDENTE",
        valor_total: "360.00",
        item_pedido: [],
      });

      const request = new Request("http://localhost/api/pedidos", {
        method: "POST",
        body: JSON.stringify({
          itens: [
            { produto_id: 1, quantidade: 1 },
            { produto_id: 1, quantidade: 2 },
          ],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(201);

      expect(findManyProdutoMock).toHaveBeenCalledWith({
        where: {
          id: {
            in: [1],
          },
        },
      });

      expect(updateManyProdutoMock).toHaveBeenCalledWith({
        where: {
          id: 1,
          estoque: {
            gte: 3,
          },
        },
        data: {
          estoque: {
            decrement: 3,
          },
        },
      });

      expect(createPedidoMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            valor_total: "360.00",
            item_pedido: {
              create: [
                {
                  produto_id: 1,
                  quantidade: 3,
                  preco_unitario: "120.00",
                },
              ],
            },
          }),
        })
      );
    });

    it("deve retornar status 500 quando ocorrer um erro inesperado", async () => {
      transactionMock.mockRejectedValue(
        new Error("Erro no banco de dados")
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const request = new Request("http://localhost/api/pedidos", {
        method: "POST",
        body: JSON.stringify({
          itens: [{ produto_id: 1, quantidade: 1 }],
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const dados = await response.json();

      expect(response.status).toBe(500);

      expect(dados).toEqual({
        erro: "Não foi possível criar o pedido.",
      });

      consoleSpy.mockRestore();
    });
  });
});
