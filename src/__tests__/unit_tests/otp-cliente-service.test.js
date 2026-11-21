
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";

const {
  prismaMock,
  enviarOTPMock,
  gerarOTPMock,
  gerarHashOTPMock,
  calcularExpiracaoOTPMock,
} = vi.hoisted(() => ({
  prismaMock: {
    cliente: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    otp_cliente: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  enviarOTPMock: vi.fn(),
  gerarOTPMock: vi.fn(),
  gerarHashOTPMock: vi.fn(),
  calcularExpiracaoOTPMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/email-service", () => ({
  enviarOTP: enviarOTPMock,
}));

vi.mock("@/lib/otp", () => ({
  gerarOTP: gerarOTPMock,
}));

vi.mock("@/lib/otp-hash", () => ({
  gerarHashOTP: gerarHashOTPMock,
}));

vi.mock("@/lib/otp-expiracao", () => ({
  calcularExpiracaoOTP: calcularExpiracaoOTPMock,
}));

import {
    solicitarOTPCliente,
    validarOTPCliente,
 } from "@/lib/otp-cliente-service";

describe("solicitarOTPCliente", () => {
  const clienteId = 1;

  const agora = new Date("2026-11-10T20:00:00.000Z");

  const clienteTeste = {
    id: clienteId,
    nome: "Cliente Teste",
    email: "teste@exemplo.com",
  };

  const novoOTP = {
    id: 10,
    cliente_id: clienteId,
    codigo_hash: "hash-teste",
    expira_em: new Date("2026-11-10T20:05:00.000Z"),
    criado_em: new Date("2026-11-10T20:00:00.000Z"),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(agora);

    vi.clearAllMocks();

    prismaMock.cliente.findUnique.mockResolvedValue(clienteTeste);

    prismaMock.otp_cliente.findFirst.mockResolvedValue(null);

    prismaMock.otp_cliente.updateMany.mockResolvedValue({
      count: 1,
    });

    prismaMock.otp_cliente.create.mockResolvedValue(novoOTP);

    prismaMock.otp_cliente.update.mockResolvedValue(novoOTP);

    prismaMock.$transaction.mockImplementation(async (operacao) => {
        if (typeof operacao === "function") {
            return operacao({
            otp_cliente: {
                updateMany: prismaMock.otp_cliente.updateMany,
                create: prismaMock.otp_cliente.create,
            },
            });
        }

        return Promise.all(operacao);
    });

    gerarOTPMock.mockReturnValue("123456");

    gerarHashOTPMock.mockReturnValue("hash-teste");

    calcularExpiracaoOTPMock.mockReturnValue(novoOTP.expira_em);

    enviarOTPMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("deve rejeitar a solicitação quando o cliente não existir", async () => {
    prismaMock.cliente.findUnique.mockResolvedValue(null);

    await expect(
      solicitarOTPCliente(clienteId)
    ).rejects.toThrow("Cliente não encontrado.");

    expect(prismaMock.otp_cliente.findFirst).not.toHaveBeenCalled();
    expect(enviarOTPMock).not.toHaveBeenCalled();
  });

  it("deve impedir uma nova solicitação antes de 60 segundos", async () => {
    prismaMock.otp_cliente.findFirst.mockResolvedValue({
      id: 5,
      criado_em: new Date(agora.getTime() - 30000),
    });

    await expect(
      solicitarOTPCliente(clienteId)
    ).rejects.toThrow(
      "Aguarde 60 segundos antes de solicitar outro código."
    );

    expect(prismaMock.otp_cliente.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.otp_cliente.create).not.toHaveBeenCalled();
    expect(enviarOTPMock).not.toHaveBeenCalled();
  });

  it("deve criar um novo OTP, desativar os anteriores e enviar o código por e-mail", async () => {
    const resultado = await solicitarOTPCliente(clienteId);

    expect(prismaMock.cliente.findUnique).toHaveBeenCalledWith({
      where: { id: clienteId },
    });

    expect(prismaMock.otp_cliente.updateMany).toHaveBeenCalledWith({
      where: {
        cliente_id: clienteId,
        ativo: true,
      },
      data: {
        ativo: false,
      },
    });

    expect(prismaMock.otp_cliente.create).toHaveBeenCalledWith({
      data: {
        cliente_id: clienteId,
        codigo_hash: "hash-teste",
        expira_em: novoOTP.expira_em,
      },
    });

    expect(enviarOTPMock).toHaveBeenCalledWith(
      clienteTeste.email,
      "123456"
    );

    expect(resultado).toEqual({
      mensagem: "Código enviado para o e-mail cadastrado.",
      expiraEm: novoOTP.expira_em.toISOString(),
      reenviarEm: new Date(
        novoOTP.criado_em.getTime() + 60000
      ).toISOString(),
    });

    expect(resultado).not.toHaveProperty("codigo");
    expect(resultado).not.toHaveProperty("codigo_hash");
  });

  it("deve desativar o novo OTP quando o envio do e-mail falhar", async () => {
    const erroEnvio = new Error("Falha no envio do e-mail");

    enviarOTPMock.mockRejectedValue(erroEnvio);

    await expect(
      solicitarOTPCliente(clienteId)
    ).rejects.toThrow("Falha no envio do e-mail");

    expect(prismaMock.otp_cliente.update).toHaveBeenCalledWith({
      where: {
        id: novoOTP.id,
      },
      data: {
        ativo: false,
      },
    });
  });
});

describe("validarOTPCliente", () => {
  const clienteId = 1;

  const hashCorreto = "a".repeat(64);
  const hashIncorreto = "b".repeat(64);

  const criarOTPTeste = (sobrescritos = {}) => ({
    id: 20,
    cliente_id: clienteId,
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

    prismaMock.otp_cliente.findFirst.mockResolvedValue(criarOTPTeste());

    prismaMock.otp_cliente.update.mockResolvedValue(criarOTPTeste());
    prismaMock.cliente.update.mockResolvedValue({
        id: clienteId,
        email_verificado: true,
    });

    gerarHashOTPMock.mockReturnValue(hashCorreto);
    });

  it("deve rejeitar a validação quando não houver OTP ativo", async () => {
    prismaMock.otp_cliente.findFirst.mockResolvedValue(null);

    const resultado = await validarOTPCliente(clienteId, "123456");

    expect(resultado).toEqual({
      sucesso: false,
      mensagem: "Nenhum código ativo encontrado.",
    });

    expect(prismaMock.otp_cliente.update).not.toHaveBeenCalled();
    expect(prismaMock.cliente.update).not.toHaveBeenCalled();
  });

  it("deve desativar o OTP quando estiver expirado", async () => {
    prismaMock.otp_cliente.findFirst.mockResolvedValue(
      criarOTPTeste({
        expira_em: new Date("2026-11-10T19:59:59.000Z"),
      })
    );

    const resultado = await validarOTPCliente(clienteId, "123456");

    expect(resultado).toEqual({
      sucesso: false,
      mensagem: "O código expirou.",
    });

    expect(prismaMock.otp_cliente.update).toHaveBeenCalledWith({
      where: { id: 20 },
      data: { ativo: false },
    });
  });

  it("deve desativar o OTP quando o limite de tentativas já tiver sido atingido", async () => {
    prismaMock.otp_cliente.findFirst.mockResolvedValue(
      criarOTPTeste({ tentativas: 5 })
    );

    const resultado = await validarOTPCliente(clienteId, "123456");

    expect(resultado).toEqual({
      sucesso: false,
      mensagem: "Limite de tentativas atingido.",
    });

    expect(prismaMock.otp_cliente.update).toHaveBeenCalledWith({
      where: { id: 20 },
      data: { ativo: false },
    });
  });

  it("deve incrementar as tentativas quando o código estiver incorreto", async () => {
    gerarHashOTPMock.mockReturnValue(hashIncorreto);

    const resultado = await validarOTPCliente(clienteId, "654321");

    expect(resultado).toEqual({
      sucesso: false,
      mensagem: "Código inválido.",
    });

    expect(prismaMock.otp_cliente.update).toHaveBeenCalledWith({
      where: { id: 20 },
      data: {
        tentativas: 1,
        ativo: true,
      },
    });

    expect(prismaMock.cliente.update).not.toHaveBeenCalled();
  });

  it("deve desativar o OTP ao atingir a quinta tentativa incorreta", async () => {
    prismaMock.otp_cliente.findFirst.mockResolvedValue(
      criarOTPTeste({ tentativas: 4 })
    );

    gerarHashOTPMock.mockReturnValue(hashIncorreto);

    const resultado = await validarOTPCliente(clienteId, "654321");

    expect(resultado).toEqual({
      sucesso: false,
      mensagem: "Limite de tentativas atingido.",
    });

    expect(prismaMock.otp_cliente.update).toHaveBeenCalledWith({
      where: { id: 20 },
      data: {
        tentativas: 5,
        ativo: false,
      },
    });
  });

  it("deve confirmar o e-mail quando o código estiver correto", async () => {
    const resultado = await validarOTPCliente(clienteId, "123456");

    expect(resultado).toEqual({
      sucesso: true,
      mensagem: "E-mail confirmado com sucesso.",
    });

    expect(prismaMock.otp_cliente.update).toHaveBeenCalledWith({
      where: { id: 20 },
      data: {
        usado: true,
        ativo: false,
      },
    });

    expect(prismaMock.cliente.update).toHaveBeenCalledWith({
      where: { id: clienteId },
      data: { email_verificado: true },
    });

    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
  });

  it("deve rejeitar um OTP expirado exatamente no instante da expiração", async () => {
    const dataExpiracao = new Date("2026-11-10T20:05:00.000Z");

    vi.setSystemTime(dataExpiracao);

    prismaMock.otp_cliente.findFirst.mockResolvedValue(
      criarOTPTeste({ expira_em: dataExpiracao })
    );

    const resultado = await validarOTPCliente(clienteId, "123456");

    expect(resultado).toEqual({
      sucesso: false,
      mensagem: "O código expirou.",
    });

    expect(prismaMock.otp_cliente.update).toHaveBeenCalledWith({
      where: { id: 20 },
      data: { ativo: false },
    });
  });
});
