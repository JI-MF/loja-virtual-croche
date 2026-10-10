import { prisma } from "@/lib/prisma";
import { gerarOTP } from "@/lib/otp";
import { gerarHashOTP } from "@/lib/otp-hash";
import { calcularExpiracaoOTP } from "@/lib/otp-expiracao";
import { enviarOTP } from "@/lib/email-service";

export async function criarOTP(contatoId) {
  const contato = await prisma.contato.findUnique({
    where: {
      id: contatoId,
    },
  });

  if (!contato) {
    throw new Error("Contato não encontrado.");
  }

  const codigo = gerarOTP();
  const codigoHash = gerarHashOTP(codigo);
  const expiraEm = calcularExpiracaoOTP();

  const otp = await prisma.otp.create({
    data: {
      contato_id: contatoId,
      codigo_hash: codigoHash,
      expira_em: expiraEm,
    },
  });

  try {
    await enviarOTP(contato.email, codigo);
  } catch (error) {
    // Se o envio do e-mail falhar, invalida o OTP
    await prisma.otp.update({
      where: {
        id: otp.id,
      },
      data: {
        ativo: false,
      },
    });

    throw error;
  }

  return {
    codigo,
    otp,
  };
}

export async function reenviarOTP(contatoId) {
  const contato = await prisma.contato.findUnique({
    where: {
      id: contatoId,
    },
  });

  if (!contato) {
    throw new Error("Contato não encontrado.");
  }

  if (contato.email_verificado) {
    throw new Error("O e-mail deste contato já foi verificado.");
  }

  // Busca o último OTP criado para esse contato
  const ultimoOTP = await prisma.otp.findFirst({
    where: {
      contato_id: contatoId,
    },
    orderBy: {
      criado_em: "desc",
    },
  });

  // Verifica o intervalo mínimo de 60 segundos
  if (ultimoOTP) {
    const agora = new Date();
    const diferenca = agora.getTime() - ultimoOTP.criado_em.getTime();

    if (diferenca < 60000) {
      throw new Error(
        "Aguarde 60 segundos antes de solicitar um novo código."
      );
    }
  }

  const codigo = gerarOTP();
  const codigoHash = gerarHashOTP(codigo);
  const expiraEm = calcularExpiracaoOTP();

  // Inativa o OTP anterior e cria o novo
  const novoOTP = await prisma.$transaction(async (tx) => {
    if (ultimoOTP && ultimoOTP.ativo) {
      await tx.otp.update({
        where: {
          id: ultimoOTP.id,
        },
        data: {
          ativo: false,
        },
      });
    }

    return await tx.otp.create({
      data: {
        contato_id: contatoId,
        codigo_hash: codigoHash,
        expira_em: expiraEm,
      },
    });
  });

  try {
    await enviarOTP(contato.email, codigo);
  } catch (error) {
    // Se o e-mail falhar, invalida o novo OTP
    await prisma.otp.update({
      where: {
        id: novoOTP.id,
      },
      data: {
        ativo: false,
      },
    });

    throw error;
  }

  return {
    otp: novoOTP,
  };
}