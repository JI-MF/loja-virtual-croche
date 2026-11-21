
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  cookiesMock,
  validarSessaoMock,
} = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  validarSessaoMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/lib/sessao-cliente-service", () => ({
  validarSessaoCliente: validarSessaoMock,
}));

import { GET } from "@/app/api/autenticacao/sessao/route";

describe("GET /api/autenticacao/sessao", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue({
        value: "token-sessao-teste",
      }),
    });

    validarSessaoMock.mockResolvedValue({
      id: 1,
      nome: "Cliente Teste",
      email: "cliente@email.com",
    });
  });

  it("deve retornar 401 quando não existir cookie de sessão", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    });

    const response = await GET();
    const dados = await response.json();

    expect(response.status).toBe(401);
    expect(dados.mensagem).toBe(
      "Cliente não autenticado."
    );

    expect(validarSessaoMock).not.toHaveBeenCalled();
  });

  it("deve retornar 401 e limpar o cookie quando a sessão for inválida", async () => {
    validarSessaoMock.mockResolvedValue(null);

    const response = await GET();
    const dados = await response.json();

    expect(response.status).toBe(401);
    expect(dados.mensagem).toBe(
      "Sessão inválida ou expirada."
    );

    expect(validarSessaoMock).toHaveBeenCalledWith(
      "token-sessao-teste"
    );

    const cookie = response.cookies.get("sessao_cliente");

    expect(cookie).toBeDefined();
    expect(cookie.value).toBe("");
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe("lax");
    expect(cookie.path).toBe("/");
    expect(new Date(cookie.expires).getTime()).toBe(0);
  });

  it("deve retornar os dados do cliente quando a sessão for válida", async () => {
    const response = await GET();
    const dados = await response.json();

    expect(response.status).toBe(200);

    expect(validarSessaoMock).toHaveBeenCalledWith(
      "token-sessao-teste"
    );

    expect(dados).toEqual({
      autenticado: true,
      cliente: {
        id: 1,
        nome: "Cliente Teste",
        email: "cliente@email.com",
      },
    });

    expect(response.cookies.get("sessao_cliente")).toBeUndefined();
  });

  it("deve retornar 500 quando ocorrer uma falha na consulta da sessão", async () => {
    const erroSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    validarSessaoMock.mockRejectedValue(
      new Error("Falha ao consultar sessão")
    );

    const response = await GET();
    const dados = await response.json();

    expect(response.status).toBe(500);
    expect(dados.mensagem).toBe(
      "Não foi possível consultar a sessão."
    );

    erroSpy.mockRestore();
  });

  it("deve retornar 500 quando ocorrer uma falha ao acessar os cookies", async () => {
    const erroSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    cookiesMock.mockRejectedValue(
      new Error("Falha ao acessar cookies")
    );

    const response = await GET();
    const dados = await response.json();

    expect(response.status).toBe(500);
    expect(dados.mensagem).toBe(
      "Não foi possível consultar a sessão."
    );

    expect(validarSessaoMock).not.toHaveBeenCalled();

    erroSpy.mockRestore();
  });
});
