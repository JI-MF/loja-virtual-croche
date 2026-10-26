
import { timingSafeEqual } from "crypto";

import { prisma } from "@/lib/prisma";
import { gerarOTP } from "@/lib/otp";
import { gerarHashOTP } from "@/lib/otp-hash";
import { calcularExpiracaoOTP } from "@/lib/otp-expiracao";
import { enviarOTP } from "@/lib/email-service";


export async function solicitarOTPCliente(clienteId) {
  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
  });

  if (!cliente) {
    throw new Error("Cliente não encontrado.");
  }

  // Busca o código mais recente desse cliente.
  const ultimoOTP = await prisma.otp_cliente.findFirst({
    where: { cliente_id: clienteId },
    orderBy: { criado_em: "desc" },
  });

  // Impede solicitações em intervalos menores que 60 segundos.
  if (ultimoOTP) {
    const diferenca =
      Date.now() - ultimoOTP.criado_em.getTime();

    if (diferenca < 60000) {
      throw new Error(
        "Aguarde 60 segundos antes de solicitar outro código."
      );
    }
  }

  const codigo = gerarOTP();
  const codigoHash = gerarHashOTP(codigo);
  const expiraEm = calcularExpiracaoOTP();

  // Desativa códigos anteriores e registra o novo.
  const novoOTP = await prisma.$transaction(async (tx) => {
    await tx.otp_cliente.updateMany({
      where: {
        cliente_id: clienteId,
        ativo: true,
      },
      data: { ativo: false },
    });

    return tx.otp_cliente.create({
      data: {
        cliente_id: clienteId,
        codigo_hash: codigoHash,
        expira_em: expiraEm,
      },
    });
  });

  // Se o envio falhar, o código não poderá ser utilizado.
  try {
    await enviarOTP(cliente.email, codigo);
  } catch (error) {
    await prisma.otp_cliente.update({
      where: { id: novoOTP.id },
      data: { ativo: false },
    });

    throw error;
  }

  // Não retorna o código nem seu hash.
  return {
    mensagem: "Código enviado para o e-mail cadastrado.",
  };
}

// Compara os hashes sem comparação textual de tempo variável.
function hashesIguais(hashA, hashB) {
  const a = Buffer.from(hashA, "hex");
  const b = Buffer.from(hashB, "hex");

  return a.length === b.length && timingSafeEqual(a, b);
}

// Valida o código recebido do cliente.
export async function validarOTPCliente(clienteId, codigo) {
  const otp = await prisma.otp_cliente.findFirst({
    where: {
      cliente_id: clienteId,
      ativo: true,
      usado: false,
    },
    orderBy: { criado_em: "desc" },
  });

  if (!otp) {
    return {
      sucesso: false,
      mensagem: "Nenhum código ativo encontrado.",
    };
  }

  if (Date.now() >= otp.expira_em.getTime()) {
    await prisma.otp_cliente.update({
      where: { id: otp.id },
      data: { ativo: false },
    });

    return {
      sucesso: false,
      mensagem: "O código expirou.",
    };
  }

  if (otp.tentativas >= 5) {
    await prisma.otp_cliente.update({
      where: { id: otp.id },
      data: { ativo: false },
    });

    return {
      sucesso: false,
      mensagem: "Limite de tentativas atingido.",
    };
  }

  const codigoHash = gerarHashOTP(codigo);

  if (!hashesIguais(codigoHash, otp.codigo_hash)) {
    const novasTentativas = otp.tentativas + 1;

    await prisma.otp_cliente.update({
      where: { id: otp.id },
      data: {
        tentativas: novasTentativas,
        ativo: novasTentativas < 5,
      },
    });

    return {
      sucesso: false,
      mensagem:
        novasTentativas >= 5
          ? "Limite de tentativas atingido."
          : "Código inválido.",
    };
  }

  // O código foi confirmado: verifica o e-mail e consome o OTP.
  await prisma.$transaction([
    prisma.otp_cliente.update({
      where: { id: otp.id },
      data: {
        usado: true,
        ativo: false,
      },
    }),

    prisma.cliente.update({
      where: { id: clienteId },
      data: { email_verificado: true },
    }),
  ]);

  return {
    sucesso: true,
    mensagem: "E-mail confirmado com sucesso.",
  };
}
