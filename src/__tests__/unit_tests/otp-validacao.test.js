
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";

const { prismaMock, gerarHashOTPMock } = vi.hoisted(() => ({
  prismaMock: {
    otp: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    contato: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  gerarHashOTPMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/otp-hash", () => ({
  gerarHashOTP: gerarHashOTPMock,
}));

import { validarOTP } from "@/lib/otp-validacao";

describe("validarOTP", () => {
  const contatoId = 1;
  const hashCorreto = "hash-correto";

  const criarOTPTeste = (sobrescritos = {}) => ({
    id: 10,
    contato_id: contatoId,
    codigo_hash: hashCorreto,
    expira_em: new Date("2026-11-10T20:05:00.000Z"),
    criado_em: new Date("2026-11-10T20:00:00.000Z"),
    tentativas: 0,
    ativo: true,
    usado: false,
    ...sobrescritos,
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-10T20:00:00.000Z"));
    vi.clearAllMocks();

    prismaMock.otp.findFirst.mockResolvedValue(criarOTPTeste());
    prismaMock.otp.update.mockResolvedValue(criarOTPTeste());

    prismaMock.contato.update.mockResolvedValue({
      id: contatoId,
      email_verificado: true,
    });

    prismaMock.$transaction.mockImplementation(async (operacoes) => {
      return Promise.all(operacoes);
    });

    gerarHashOTPMock.mockReturnValue(hashCorreto);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("deve rejeitar a validação quando não houver OTP ativo", async () => {
    prismaMock.otp.findFirst.mockResolvedValue(null);

    const resultado = await validarOTP(contatoId, "123456");

    expect(resultado).toEqual({
      sucesso: false,
      mensagem: "Nenhum OTP ativo encontrado.",
    });

    expect(prismaMock.otp.update).not.toHaveBeenCalled();
    expect(prismaMock.contato.update).not.toHaveBeenCalled();
  });

  it("deve desativar o OTP quando estiver expirado", async () => {
    prismaMock.otp.findFirst.mockResolvedValue(
      criarOTPTeste({
        expira_em: new Date("2026-11-10T19:59:00.000Z"),
      })
    );

    const resultado = await validarOTP(contatoId, "123456");

    expect(resultado).toEqual({
      sucesso: false,
      mensagem: "O código expirou.",
    });

    expect(prismaMock.otp.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { ativo: false },
    });
  });

  it("deve desativar o OTP quando o limite de tentativas já tiver sido atingido", async () => {
    prismaMock.otp.findFirst.mockResolvedValue(
      criarOTPTeste({ tentativas: 5 })
    );

    const resultado = await validarOTP(contatoId, "123456");

    expect(resultado).toEqual({
      sucesso: false,
      mensagem: "Limite de tentativas atingido.",
    });

    expect(prismaMock.otp.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { ativo: false },
    });
  });

  it("deve incrementar as tentativas quando o código estiver incorreto", async () => {
    gerarHashOTPMock.mockReturnValue("hash-incorreto");

    const resultado = await validarOTP(contatoId, "654321");

    expect(resultado).toEqual({
      sucesso: false,
      mensagem: "Código inválido.",
    });

    expect(prismaMock.otp.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: {
        tentativas: 1,
        ativo: true,
      },
    });

    expect(prismaMock.contato.update).not.toHaveBeenCalled();
  });

  it("deve desativar o OTP ao atingir a quinta tentativa incorreta", async () => {
    prismaMock.otp.findFirst.mockResolvedValue(
      criarOTPTeste({ tentativas: 4 })
    );

    gerarHashOTPMock.mockReturnValue("hash-incorreto");

    const resultado = await validarOTP(contatoId, "654321");

    expect(resultado).toEqual({
      sucesso: false,
      mensagem: "Limite de tentativas atingido.",
    });

    expect(prismaMock.otp.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: {
        tentativas: 5,
        ativo: false,
      },
    });
  });

  it("deve confirmar o e-mail quando o código estiver correto", async () => {
    const resultado = await validarOTP(contatoId, "123456");

    expect(resultado).toEqual({
      sucesso: true,
      mensagem: "E-mail verificado com sucesso.",
    });

    expect(prismaMock.otp.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: {
        usado: true,
        ativo: false,
      },
    });

    expect(prismaMock.contato.update).toHaveBeenCalledWith({
      where: { id: contatoId },
      data: { email_verificado: true },
    });

    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
  });
});
