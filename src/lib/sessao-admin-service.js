
import { createHash, randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";

const DURACAO_SESSAO_HORAS = 8;

function gerarTokenSessao() {
  return randomBytes(32).toString("hex");
}

function gerarHashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function calcularExpiracaoSessao() {
  const expiracao = new Date();

  expiracao.setHours(
    expiracao.getHours() + DURACAO_SESSAO_HORAS
  );

  return expiracao;
}

// Cria uma sessão para um administrador ativo.
export async function criarSessaoAdmin(adminId) {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      ativo: true,
    },
  });

  if (!admin) {
    throw new Error("Administrador não encontrado.");
  }

  if (!admin.ativo) {
    throw new Error("Esta conta administrativa está inativa.");
  }

  const token = gerarTokenSessao();
  const tokenHash = gerarHashToken(token);
  const expiraEm = calcularExpiracaoSessao();

  await prisma.sessao_admin.create({
    data: {
      admin_id: adminId,
      token_hash: tokenHash,
      expira_em: expiraEm,
    },
  });

  return {
    token,
    expiraEm,
  };
}

// Valida a sessão e retorna os dados do administrador.
export async function validarSessaoAdmin(token) {
  if (
    typeof token !== "string" ||
    !/^[a-f0-9]{64}$/.test(token)
  ) {
    return null;
  }

  const tokenHash = gerarHashToken(token);

  const sessao = await prisma.sessao_admin.findUnique({
    where: {
      token_hash: tokenHash,
    },
    include: {
      admin: {
        select: {
          id: true,
          nome: true,
          email: true,
          ativo: true,
        },
      },
    },
  });

  if (!sessao || sessao.revogado) {
    return null;
  }

  if (new Date() >= sessao.expira_em) {
    return null;
  }

  if (!sessao.admin.ativo) {
    return null;
  }

  return {
    id: sessao.admin.id,
    nome: sessao.admin.nome,
    email: sessao.admin.email,
    expiraEm: sessao.expira_em,
  };
}

// Revoga a sessão correspondente ao token recebido.
export async function revogarSessaoAdmin(token) {
  if (
    typeof token !== "string" ||
    !/^[a-f0-9]{64}$/.test(token)
  ) {
    return false;
  }

  const tokenHash = gerarHashToken(token);

  const resultado = await prisma.sessao_admin.updateMany({
    where: {
      token_hash: tokenHash,
      revogado: false,
    },
    data: {
      revogado: true,
    },
  });

  return resultado.count > 0;
}
