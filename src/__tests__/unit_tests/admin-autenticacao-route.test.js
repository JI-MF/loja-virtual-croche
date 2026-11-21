
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  autenticarAdminMock,
  cookiesMock,
  validarSessaoMock,
  revogarSessaoMock,
} = vi.hoisted(() => ({
  autenticarAdminMock: vi.fn(),
  cookiesMock: vi.fn(),
  validarSessaoMock: vi.fn(),
  revogarSessaoMock: vi.fn(),
}));

vi.mock("@/lib/admin-auth-service", () => ({
  autenticarAdmin: autenticarAdminMock,
}));

vi.mock("@/lib/sessao-admin-service", () => ({
  validarSessaoAdmin: validarSessaoMock,
  revogarSessaoAdmin: revogarSessaoMock,
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

import { POST as login } from "@/app/api/admin/autenticacao/login/route";
import { POST as logout } from "@/app/api/admin/autenticacao/logout/route";
import { GET as sessao } from "@/app/api/admin/sessao/route";

const requestJson = (dados) =>
  new Request("http://localhost/api/admin/autenticacao/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(dados),
  });

describe("autenticação administrativa", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    autenticarAdminMock.mockResolvedValue({
      id: 7,
      nome: "Admin",
      email: "admin@teste.com",
      token: "a".repeat(64),
      expiraEm: new Date(Date.now() + 3600000),
    });

    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue({
        value: "a".repeat(64),
      }),
    });

    validarSessaoMock.mockResolvedValue({
      id: 7,
      nome: "Admin",
      email: "admin@teste.com",
    });

    revogarSessaoMock.mockResolvedValue(true);
  });

  it("realiza login e configura cookie httpOnly", async () => {
    const response = await login(
      requestJson({
        email: " ADMIN@TESTE.COM ",
        senha: "Senha123",
      })
    );

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body.admin).toEqual({
      id: 7,
      nome: "Admin",
      email: "admin@teste.com",
    });

    expect(autenticarAdminMock).toHaveBeenCalledWith(
      "admin@teste.com",
      "Senha123"
    );

    expect(response.cookies.get("sessao_admin").httpOnly).toBe(true);
  });

  it.each([
    { email: "", senha: "x" },
    { email: "a@b.com", senha: "" },
    { senha: "x" },
  ])("rejeita credenciais incompletas", async (dados) => {
    const response = await login(requestJson(dados));

    expect(response.status).toBe(400);
    expect(autenticarAdminMock).not.toHaveBeenCalled();
  });

  it("retorna 401 para credenciais incorretas", async () => {
    autenticarAdminMock.mockResolvedValue(null);

    const response = await login(
      requestJson({
        email: "admin@teste.com",
        senha: "errada",
      })
    );

    expect(response.status).toBe(401);
  });

  it("retorna 500 quando o serviço de autenticação falha", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    autenticarAdminMock.mockRejectedValue(new Error("db"));

    const response = await login(
      requestJson({
        email: "admin@teste.com",
        senha: "x",
      })
    );

    expect(response.status).toBe(500);

    spy.mockRestore();
  });

  it("retorna sessão administrativa autenticada", async () => {
    const response = await sessao();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.autenticado).toBe(true);

    expect(validarSessaoMock).toHaveBeenCalledWith("a".repeat(64));
  });

  it("retorna 401 e limpa cookie para sessão inválida", async () => {
    validarSessaoMock.mockResolvedValue(null);

    const response = await sessao();

    expect(response.status).toBe(401);
    expect(response.cookies.get("sessao_admin").value).toBe("");
  });

  it("retorna 500 se a validação da sessão falhar", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    validarSessaoMock.mockRejectedValue(new Error("db"));

    const response = await sessao();

    expect(response.status).toBe(500);

    spy.mockRestore();
  });

  it("revoga sessão e limpa cookie no logout", async () => {
    const response = await logout();

    expect(response.status).toBe(200);

    expect(revogarSessaoMock).toHaveBeenCalledWith("a".repeat(64));

    expect(response.cookies.get("sessao_admin").value).toBe("");
  });

  it("faz logout sem token", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    });

    const response = await logout();

    expect(response.status).toBe(200);
    expect(revogarSessaoMock).not.toHaveBeenCalled();
  });
});
