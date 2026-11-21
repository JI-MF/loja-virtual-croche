
import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock, criarOTPMock } = vi.hoisted(() => ({
  prismaMock: {
    produto: {
      findUnique: vi.fn(),
    },
    contato: {
      create: vi.fn(),
    },
  },
  criarOTPMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/otp-service", () => ({
  criarOTP: criarOTPMock,
}));

import { POST } from "@/app/api/cadastro/route";

const dadosValidos = {
  nome: "Maria Silva",
  email: "maria@email.com",
  telefone: "92999999999",
  mensagem: "Gostaria de saber mais sobre os produtos.",
};

const contatoCriado = {
  id: 1,
  ...dadosValidos,
  produto_id: null,
};

function criarRequest(dados) {
  return new Request("http://localhost:3000/api/cadastro", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dados),
  });
}

describe("POST /api/cadastro", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock.produto.findUnique.mockResolvedValue({
      id: 1,
      nome: "Bolsa de crochê",
    });

    prismaMock.contato.create.mockResolvedValue(contatoCriado);

    criarOTPMock.mockResolvedValue({
      codigo: "123456",
    });
  });

  it("deve cadastrar um contato com produto", async () => {
    const response = await POST(
      criarRequest({
        ...dadosValidos,
        produto_id: 1,
      })
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.mensagem).toBe("Cadastro realizado com sucesso");

    expect(prismaMock.produto.findUnique).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });

    expect(prismaMock.contato.create).toHaveBeenCalledWith({
      data: {
        ...dadosValidos,
        produto_id: 1,
      },
    });

    expect(criarOTPMock).toHaveBeenCalledWith(contatoCriado.id);
  });

  it("deve cadastrar um contato sem produto", async () => {
    const response = await POST(
      criarRequest(dadosValidos)
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.mensagem).toBe("Cadastro realizado com sucesso");

    expect(prismaMock.produto.findUnique).not.toHaveBeenCalled();

    expect(prismaMock.contato.create).toHaveBeenCalledWith({
      data: {
        ...dadosValidos,
        produto_id: null,
      },
    });

    expect(criarOTPMock).toHaveBeenCalledWith(contatoCriado.id);
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
    expect(body.erro).toBe("Dados inválidos");

    expect(prismaMock.contato.create).not.toHaveBeenCalled();
    expect(criarOTPMock).not.toHaveBeenCalled();
  });

  it("deve retornar 404 quando o produto não existir", async () => {
    prismaMock.produto.findUnique.mockResolvedValue(null);

    const response = await POST(
      criarRequest({
        ...dadosValidos,
        produto_id: 999,
      })
    );

    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.erro).toBe("Produto não encontrado");

    expect(prismaMock.contato.create).not.toHaveBeenCalled();
    expect(criarOTPMock).not.toHaveBeenCalled();
  });

  it("deve retornar 500 quando ocorrer falha ao criar o contato", async () => {
    prismaMock.contato.create.mockRejectedValue(
      new Error("Erro no banco de dados")
    );

    const response = await POST(
      criarRequest(dadosValidos)
    );

    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.erro).toBe("Erro interno do servidor");

    expect(criarOTPMock).not.toHaveBeenCalled();
  });

  it("deve retornar 500 quando ocorrer falha ao criar ou enviar o OTP", async () => {
    criarOTPMock.mockRejectedValue(
      new Error("Falha no envio do OTP")
    );

    const response = await POST(
      criarRequest(dadosValidos)
    );

    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.erro).toBe("Erro interno do servidor");

    expect(prismaMock.contato.create).toHaveBeenCalled();
    expect(criarOTPMock).toHaveBeenCalledWith(contatoCriado.id);
  });
});
