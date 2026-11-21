
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findUniqueMock,
  solicitarOTPMock,
} = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  solicitarOTPMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cliente: {
      findUnique: findUniqueMock,
    },
  },
}));

vi.mock("@/lib/otp-cliente-service", () => ({
  solicitarOTPCliente: solicitarOTPMock,
}));

import { POST } from "@/app/api/autenticacao/solicitar-codigo/route";

function criarRequest(dados) {
  return {
    json: vi.fn().mockResolvedValue(dados),
  };
}

describe("POST /api/autenticacao/solicitar-codigo", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    findUniqueMock.mockResolvedValue({
      id: 1,
      email: "cliente@email.com",
    });

    solicitarOTPMock.mockResolvedValue({
      mensagem: "Código enviado para o e-mail cadastrado.",
      expiraEm: "2026-11-11T14:30:00.000Z",
      reenviarEm: "2026-11-11T14:25:00.000Z",
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
    const response = await POST(criarRequest({ email: "" }));
    const dados = await response.json();

    expect(response.status).toBe(400);
    expect(dados.mensagem).toBe("Informe um e-mail válido.");
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("deve retornar 400 quando o e-mail for inválido", async () => {
    const response = await POST(
      criarRequest({ email: "email-invalido" })
    );

    const dados = await response.json();

    expect(response.status).toBe(400);
    expect(dados.mensagem).toBe("Informe um e-mail válido.");
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("deve retornar uma resposta genérica quando o cliente não existir", async () => {
    findUniqueMock.mockResolvedValue(null);

    const response = await POST(
      criarRequest({ email: "inexistente@email.com" })
    );

    const dados = await response.json();

    expect(response.status).toBe(200);
    expect(dados.mensagem).toBe(
      "Se o e-mail estiver cadastrado, você receberá um código."
    );

    expect(solicitarOTPMock).not.toHaveBeenCalled();
  });

  it("deve solicitar o OTP quando o cliente existir", async () => {
    const response = await POST(
      criarRequest({ email: " CLIENTE@EMAIL.COM " })
    );

    const dados = await response.json();

    expect(response.status).toBe(200);

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { email: "cliente@email.com" },
    });

    expect(solicitarOTPMock).toHaveBeenCalledWith(1);

    expect(dados.expiraEm).toBe(
      "2026-11-11T14:30:00.000Z"
    );

    expect(dados.reenviarEm).toBe(
      "2026-11-11T14:25:00.000Z"
    );

    expect(JSON.stringify(dados)).not.toContain("123456");
    expect(JSON.stringify(dados)).not.toContain("codigo_hash");
  });

  it("deve retornar 429 quando o intervalo de reenvio não for respeitado", async () => {
    solicitarOTPMock.mockRejectedValue(
      new Error(
        "Aguarde 60 segundos antes de solicitar outro código."
      )
    );

    const response = await POST(
      criarRequest({ email: "cliente@email.com" })
    );

    const dados = await response.json();

    expect(response.status).toBe(429);

    expect(dados.mensagem).toBe(
      "Aguarde 60 segundos antes de solicitar outro código."
    );
  });

  it("deve retornar 500 quando ocorrer uma falha ao solicitar o OTP", async () => {
    const erroSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    solicitarOTPMock.mockRejectedValue(
      new Error("Falha no envio do e-mail")
    );

    const response = await POST(
      criarRequest({ email: "cliente@email.com" })
    );

    const dados = await response.json();

    expect(response.status).toBe(500);
    expect(dados.mensagem).toBe(
      "Não foi possível solicitar o código."
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
      criarRequest({ email: "cliente@email.com" })
    );

    const dados = await response.json();

    expect(response.status).toBe(500);
    expect(dados.mensagem).toBe(
      "Não foi possível solicitar o código."
    );

    expect(solicitarOTPMock).not.toHaveBeenCalled();

    erroSpy.mockRestore();
  });
});
