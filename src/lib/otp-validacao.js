import { prisma } from "@/lib/prisma";
import { gerarHashOTP } from "@/lib/otp-hash";

export async function validarOTP(contatoId, codigo) {
  const otp = await prisma.otp.findFirst({
    where: {
      contato_id: contatoId,
      ativo: true,
      usado: false,
    },
    orderBy: {
      criado_em: "desc",
    },
  });

  if (!otp) {
    return {
      sucesso: false,
      mensagem: "Nenhum OTP ativo encontrado.",
    };
  }

  if (new Date() > otp.expira_em) {
    await prisma.otp.update({
      where: {
        id: otp.id,
      },
      data: {
        ativo: false,
      },
    });

    return {
      sucesso: false,
      mensagem: "O código expirou.",
    };
  }

  if (otp.tentativas >= 5) {
    await prisma.otp.update({
      where: {
        id: otp.id,
      },
      data: {
        ativo: false,
      },
    });

    return {
      sucesso: false,
      mensagem: "Limite de tentativas atingido.",
    };
  }

  const codigoHash = gerarHashOTP(codigo);

    if (codigoHash !== otp.codigo_hash) {
        const novasTentativas = otp.tentativas + 1;

        await prisma.otp.update({
            where: {
            id: otp.id,
            },
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

  await prisma.$transaction([
    prisma.otp.update({
      where: {
        id: otp.id,
      },
      data: {
        usado: true,
        ativo: false,
      },
    }),

    prisma.contato.update({
      where: {
        id: contatoId,
      },
      data: {
        email_verificado: true,
      },
    }),
  ]);

  return {
    sucesso: true,
    mensagem: "E-mail verificado com sucesso.",
  };
}