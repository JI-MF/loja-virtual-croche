
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  cookiesMock,
  revogarSessaoMock,
} = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  revogarSessaoMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/lib/sessao-cliente-service", () => ({
  revogarSessaoCliente: revogarSessaoMock,
}));

import { POST } from "@/app/api/autenticacao/logout/route";

describe("POST /api/autenticacao/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue({
        value: "token-sessao-teste",
      }),
    });

    revogarSessaoMock.mockResolvedValue(undefined);
  });

  it("deve revogar a sessão e remover o cookie quando existir um token", async () => {
    const response = await POST();
    const dados = await response.json();

    expect(response.status).toBe(200);
    expect(dados.mensagem).toBe(
      "Logout realizado com sucesso."
    );

    expect(revogarSessaoMock).toHaveBeenCalledWith(
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

  it("deve realizar logout sem revogar sessão quando não existir cookie", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    });

    const response = await POST();
    const dados = await response.json();

    expect(response.status).toBe(200);
    expect(dados.mensagem).toBe(
      "Logout realizado com sucesso."
    );

    expect(revogarSessaoMock).not.toHaveBeenCalled();

    const cookie = response.cookies.get("sessao_cliente");

    expect(cookie).toBeDefined();
    expect(cookie.value).toBe("");
    expect(new Date(cookie.expires).getTime()).toBe(0);
  });

  it("deve retornar 500 quando ocorrer falha ao revogar a sessão", async () => {
    const erroSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    revogarSessaoMock.mockRejectedValue(
      new Error("Falha ao revogar sessão")
    );

    const response = await POST();
    const dados = await response.json();

    expect(response.status).toBe(500);
    expect(dados.mensagem).toBe(
      "Não foi possível realizar o logout."
    );

    erroSpy.mockRestore();
  });

  it("deve retornar 500 quando ocorrer falha ao acessar os cookies", async () => {
    const erroSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    cookiesMock.mockRejectedValue(
      new Error("Falha ao acessar cookies")
    );

    const response = await POST();
    const dados = await response.json();

    expect(response.status).toBe(500);
    expect(dados.mensagem).toBe(
      "Não foi possível realizar o logout."
    );

    expect(revogarSessaoMock).not.toHaveBeenCalled();

    erroSpy.mockRestore();
  });

  it("não deve tentar revogar uma sessão quando o token estiver vazio", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue({
        value: "",
      }),
    });

    const response = await POST();

    expect(response.status).toBe(200);
    expect(revogarSessaoMock).not.toHaveBeenCalled();

    const cookie = response.cookies.get("sessao_cliente");

    expect(cookie).toBeDefined();
    expect(cookie.value).toBe("");
  });
});
