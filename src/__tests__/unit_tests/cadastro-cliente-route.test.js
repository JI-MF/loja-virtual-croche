
import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock, solicitarOTPMock, txMock } = vi.hoisted(() => ({
  prismaMock: {
    cliente: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },

  txMock: {
    produto: {
      findUnique: vi.fn(),
    },
    cliente: {
      create: vi.fn(),
      delete: vi.fn(),
    },
    contato: {
      create: vi.fn(),
      delete: vi.fn(),
    },
  },

  solicitarOTPMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/otp-cliente-service", () => ({
  solicitarOTPCliente: solicitarOTPMock,
}));

import { POST } from "@/app/api/autenticacao/cadastro/route";

const dadosValidos = {
  nome: "Maria Silva",
  email: "maria@email.com",
  telefone: "92999999999",
};

const clienteCriado = {
  id: 1,
  ...dadosValidos,
};

const contatoCriado = {
  id: 10,
  ...dadosValidos,
  mensagem: "Interesse no produto: Bolsa de crochê",
  produto_id: 1,
};

const produtoExistente = {
  id: 1,
  nome: "Bolsa de crochê",
};

function criarRequest(dados) {
  return new Request(
    "http://localhost:3000/api/autenticacao/cadastro",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    }
  );
}

describe("POST /api/autenticacao/cadastro", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock.cliente.findUnique.mockResolvedValue(null);

    prismaMock.$transaction.mockImplementation(async (operacao) => {
      return operacao(txMock);
    });

    txMock.produto.findUnique.mockResolvedValue(produtoExistente);

    txMock.cliente.create.mockResolvedValue(clienteCriado);
    txMock.cliente.delete.mockResolvedValue(clienteCriado);

    txMock.contato.create.mockResolvedValue(contatoCriado);
    txMock.contato.delete.mockResolvedValue(contatoCriado);

    solicitarOTPMock.mockResolvedValue({});
  });

  it("deve cadastrar um cliente sem produto", async () => {
    const response = await POST(
      criarRequest(dadosValidos)
    );

    const body = await response.json();

    expect(response.status).toBe(201);

    expect(body.mensagem).toContain(
      "Cadastro realizado"
    );

    expect(prismaMock.cliente.findUnique).toHaveBeenCalledWith({
      where: {
        email: dadosValidos.email,
      },
    });

    expect(txMock.produto.findUnique).not.toHaveBeenCalled();

    expect(txMock.cliente.create).toHaveBeenCalledWith({
      data: dadosValidos,
    });

    expect(txMock.contato.create).not.toHaveBeenCalled();

    expect(solicitarOTPMock).toHaveBeenCalledWith(
      clienteCriado.id
    );
  });

  it("deve cadastrar um cliente com produto", async () => {
    const response = await POST(
      criarRequest({
        ...dadosValidos,
        produto_id: 1,
      })
    );

    const body = await response.json();

    expect(response.status).toBe(201);

    expect(body.mensagem).toContain(
      "Cadastro realizado"
    );

    expect(txMock.produto.findUnique).toHaveBeenCalledTimes(1);

    expect(txMock.produto.findUnique).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });

    expect(txMock.cliente.create).toHaveBeenCalledWith({
      data: dadosValidos,
    });

    expect(txMock.contato.create).toHaveBeenCalledWith({
      data: {
        ...dadosValidos,
        mensagem: "Interesse no produto: Bolsa de crochê",
        produto_id: 1,
      },
    });

    expect(solicitarOTPMock).toHaveBeenCalledWith(
      clienteCriado.id
    );
  });

  it("deve rejeitar dados inválidos", async () => {
    const response = await POST(
      criarRequest({
        ...dadosValidos,
        nome: "Ma",
      })
    );

    const body = await response.json();

    expect(response.status).toBe(400);

    expect(body.mensagem).toBe(
      "Verifique os dados informados."
    );

    expect(prismaMock.cliente.findUnique).not.toHaveBeenCalled();

    expect(txMock.cliente.create).not.toHaveBeenCalled();

    expect(solicitarOTPMock).not.toHaveBeenCalled();
  });

  it("deve retornar 409 quando o e-mail já estiver cadastrado", async () => {
    prismaMock.cliente.findUnique.mockResolvedValue(
      clienteCriado
    );

    const response = await POST(
      criarRequest(dadosValidos)
    );

    const body = await response.json();

    expect(response.status).toBe(409);

    expect(body.mensagem).toContain(
      "Este e-mail já possui cadastro"
    );

    expect(prismaMock.$transaction).not.toHaveBeenCalled();

    expect(solicitarOTPMock).not.toHaveBeenCalled();
  });

  it("deve retornar 404 quando o produto não existir", async () => {
    txMock.produto.findUnique.mockResolvedValue(null);

    const response = await POST(
      criarRequest({
        ...dadosValidos,
        produto_id: 999,
      })
    );

    const body = await response.json();

    expect(response.status).toBe(404);

    expect(body.mensagem).toBe(
      "O produto selecionado não foi encontrado."
    );

    expect(txMock.cliente.create).not.toHaveBeenCalled();

    expect(txMock.contato.create).not.toHaveBeenCalled();

    expect(solicitarOTPMock).not.toHaveBeenCalled();
  });

  it("deve retornar 500 quando ocorrer falha ao criar o cliente", async () => {
    txMock.cliente.create.mockRejectedValue(
      new Error("Erro no banco de dados")
    );

    const response = await POST(
      criarRequest(dadosValidos)
    );

    const body = await response.json();

    expect(response.status).toBe(500);

    expect(body.mensagem).toContain(
      "Não foi possível concluir o cadastro"
    );

    expect(solicitarOTPMock).not.toHaveBeenCalled();
  });

  it("deve excluir cliente e contato quando a solicitação do OTP falhar", async () => {
    solicitarOTPMock.mockRejectedValue(
      new Error("Falha no envio do OTP")
    );

    const response = await POST(
      criarRequest({
        ...dadosValidos,
        produto_id: 1,
      })
    );

    const body = await response.json();

    expect(response.status).toBe(500);

    expect(body.mensagem).toContain(
      "Não foi possível concluir o cadastro"
    );

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(2);

    expect(txMock.contato.delete).toHaveBeenCalledWith({
      where: {
        id: contatoCriado.id,
      },
    });

    expect(txMock.cliente.delete).toHaveBeenCalledWith({
      where: {
        id: clienteCriado.id,
      },
    });
  });

  it("deve retornar 500 quando ocorrer falha na consulta de cliente", async () => {
    prismaMock.cliente.findUnique.mockRejectedValue(
      new Error("Falha na consulta ao banco")
    );

    const response = await POST(
      criarRequest(dadosValidos)
    );

    const body = await response.json();

    expect(response.status).toBe(500);

    expect(body.mensagem).toContain(
      "Não foi possível concluir o cadastro"
    );

    expect(prismaMock.$transaction).not.toHaveBeenCalled();

    expect(solicitarOTPMock).not.toHaveBeenCalled();
  });
   it("deve cadastrar um cliente quando produto_id for null", async () => {
    const response = await POST(
      criarRequest({
        ...dadosValidos,
        produto_id: null,
      })
    );

    const body = await response.json();

    expect(response.status).toBe(201);

    expect(body.mensagem).toContain(
      "Cadastro realizado"
    );

    expect(txMock.produto.findUnique).not.toHaveBeenCalled();

    expect(txMock.cliente.create).toHaveBeenCalledWith({
      data: dadosValidos,
    });

    expect(txMock.contato.create).not.toHaveBeenCalled();

    expect(solicitarOTPMock).toHaveBeenCalledWith(
      clienteCriado.id
    );
  });

  it("deve retornar 500 quando ocorrer falha ao criar o contato", async () => {
    const erroSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    txMock.contato.create.mockRejectedValue(
      new Error("Falha ao criar contato")
    );

    const response = await POST(
      criarRequest({
        ...dadosValidos,
        produto_id: 1,
      })
    );

    const body = await response.json();

    expect(response.status).toBe(500);

    expect(body.mensagem).toContain(
      "Não foi possível concluir o cadastro"
    );

    expect(txMock.cliente.create).toHaveBeenCalled();

    expect(solicitarOTPMock).not.toHaveBeenCalled();

    // A transação de criação deve falhar antes da solicitação do OTP.
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);

    erroSpy.mockRestore();
  });

  it("deve retornar 500 quando ocorrer falha durante a exclusão dos registros", async () => {
    const erroSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    solicitarOTPMock.mockRejectedValue(
      new Error("Falha no envio do OTP")
    );

    txMock.contato.delete.mockRejectedValue(
      new Error("Falha ao excluir contato")
    );

    const response = await POST(
      criarRequest({
        ...dadosValidos,
        produto_id: 1,
      })
    );

    const body = await response.json();

    expect(response.status).toBe(500);

    expect(body.mensagem).toContain(
      "Não foi possível concluir o cadastro"
    );

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(2);

    expect(txMock.contato.delete).toHaveBeenCalled();

    // O cliente não deve ser excluído se a exclusão do contato falhar.
    expect(txMock.cliente.delete).not.toHaveBeenCalled();

    erroSpy.mockRestore();
  });

});
