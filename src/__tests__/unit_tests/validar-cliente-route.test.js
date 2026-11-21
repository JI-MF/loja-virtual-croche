
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findUniqueMock,
  validarOTPMock,
  criarSessaoMock,
} = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  validarOTPMock: vi.fn(),
  criarSessaoMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cliente: {
      findUnique: findUniqueMock,
    },
  },
}));

vi.mock("@/lib/otp-cliente-service", () => ({
  validarOTPCliente: validarOTPMock,
}));

vi.mock("@/lib/sessao-cliente-service", () => ({
  criarSessaoCliente: criarSessaoMock,
}));

import { POST } from "@/app/api/autenticacao/validar/route";

function criarRequest(dados) {
  return {
    json: vi.fn().mockResolvedValue(dados),
  };
}

describe("POST /api/autenticacao/validar", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    findUniqueMock.mockResolvedValue({
      id: 1,
      email: "cliente@email.com",
    });

    validarOTPMock.mockResolvedValue({
      sucesso: true,
      mensagem: "E-mail confirmado com sucesso.",
    });

    criarSessaoMock.mockResolvedValue({
      token: "token-sessao-teste",
      expiraEm: new Date("2026-12-11T12:00:00.000Z"),
    });
  });

  it("deve retornar 400 quando o JSON for inválido", async () => {
    const request = {
      json: vi.fn().mockRejectedValue(new Error("JSON inválido")),
    };

    const response = await POST(request);
    const dados = await response.json();

    expect(response.status).toBe(400);
    expect(dados.mensagem).toBe("Envie um JSON válido.");

    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("deve retornar 400 quando o e-mail estiver vazio", async () => {
    const response = await POST(
      criarRequest({ email: "", codigo: "123456" })
    );

    const dados = await response.json();

    expect(response.status).toBe(400);
    expect(dados.mensagem).toBe(
      "Informe um e-mail válido e um código de seis dígitos."
    );

    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("deve retornar 400 quando o código tiver menos de seis dígitos", async () => {
    const response = await POST(
      criarRequest({
        email: "cliente@email.com",
        codigo: "12345",
      })
    );

    expect(response.status).toBe(400);
    expect(validarOTPMock).not.toHaveBeenCalled();
  });

  it("deve retornar 400 quando o código possuir caracteres não numéricos", async () => {
    const response = await POST(
      criarRequest({
        email: "cliente@email.com",
        codigo: "12AB56",
      })
    );

    expect(response.status).toBe(400);
    expect(validarOTPMock).not.toHaveBeenCalled();
  });

  it("deve retornar 400 quando o cliente não for encontrado", async () => {
    findUniqueMock.mockResolvedValue(null);

    const response = await POST(
      criarRequest({
        email: "inexistente@email.com",
        codigo: "123456",
      })
    );

    const dados = await response.json();

    expect(response.status).toBe(400);
    expect(dados.mensagem).toBe(
      "Não foi possível validar o código."
    );

    expect(validarOTPMock).not.toHaveBeenCalled();
    expect(criarSessaoMock).not.toHaveBeenCalled();
  });

  it("deve retornar 400 quando o código OTP for inválido", async () => {
    validarOTPMock.mockResolvedValue({
      sucesso: false,
      mensagem: "Código inválido.",
    });

    const response = await POST(
      criarRequest({
        email: "cliente@email.com",
        codigo: "123456",
      })
    );

    const dados = await response.json();

    expect(response.status).toBe(400);
    expect(dados.mensagem).toBe("Código inválido.");

    expect(criarSessaoMock).not.toHaveBeenCalled();
  });

  it("deve retornar 400 quando o código estiver expirado", async () => {
    validarOTPMock.mockResolvedValue({
      sucesso: false,
      mensagem: "O código expirou.",
    });

    const response = await POST(
      criarRequest({
        email: "cliente@email.com",
        codigo: "123456",
      })
    );

    const dados = await response.json();

    expect(response.status).toBe(400);
    expect(dados.mensagem).toBe("O código expirou.");

    expect(criarSessaoMock).not.toHaveBeenCalled();
  });

  it("deve autenticar o cliente e configurar o cookie quando o código for válido", async () => {
    const response = await POST(
      criarRequest({
        email: " CLIENTE@EMAIL.COM ",
        codigo: "123456",
      })
    );

    const dados = await response.json();

    expect(response.status).toBe(200);

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { email: "cliente@email.com" },
    });

    expect(validarOTPMock).toHaveBeenCalledWith(1, "123456");
    expect(criarSessaoMock).toHaveBeenCalledWith(1);

    expect(dados.mensagem).toBe(
      "Autenticação realizada com sucesso."
    );

    expect(dados.token).toBeUndefined();

    const cookie = response.cookies.get("sessao_cliente");

    expect(cookie).toBeDefined();
    expect(cookie.value).toBe("token-sessao-teste");
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe("lax");
    expect(cookie.path).toBe("/");
  });

  it("deve retornar 500 quando ocorrer uma falha ao criar a sessão", async () => {
    const erroSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    criarSessaoMock.mockRejectedValue(
      new Error("Falha ao criar sessão")
    );

    const response = await POST(
      criarRequest({
        email: "cliente@email.com",
        codigo: "123456",
      })
    );

    const dados = await response.json();

    expect(response.status).toBe(500);
    expect(dados.mensagem).toBe(
      "Não foi possível concluir a autenticação."
    );

    erroSpy.mockRestore();
  });

  it("deve retornar 500 quando ocorrer uma falha na consulta ao banco", async () => {
    const erroSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    findUniqueMock.mockRejectedValue(
      new Error("Falha no banco de dados")
    );

    const response = await POST(
      criarRequest({
        email: "cliente@email.com",
        codigo: "123456",
      })
    );

    const dados = await response.json();

    expect(response.status).toBe(500);
    expect(dados.mensagem).toBe(
      "Não foi possível concluir a autenticação."
    );

    expect(validarOTPMock).not.toHaveBeenCalled();
    expect(criarSessaoMock).not.toHaveBeenCalled();

    erroSpy.mockRestore();
  });
});
