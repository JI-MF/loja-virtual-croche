
import { createHash, randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";

const DURACAO_SESSAO_DIAS = 30;

function gerarTokenSessao() {
  return randomBytes(32).toString("hex");
}

function gerarHashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function calcularExpiracaoSessao() {
  const expiracao = new Date();

  expiracao.setDate(
    expiracao.getDate() + DURACAO_SESSAO_DIAS
  );

  return expiracao;
}

// Cria uma sessão para um cliente com e-mail confirmado.
export async function criarSessaoCliente(clienteId) {
  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    select: {
      id: true,
      email_verificado: true,
    },
  });

  if (!cliente) {
    throw new Error("Cliente não encontrado.");
  }

  if (!cliente.email_verificado) {
    throw new Error("O e-mail do cliente ainda não foi confirmado.");
  }

  const token = gerarTokenSessao();
  const tokenHash = gerarHashToken(token);
  const expiraEm = calcularExpiracaoSessao();

  await prisma.sessao_cliente.create({
    data: {
      cliente_id: clienteId,
      token_hash: tokenHash,
      expira_em: expiraEm,
    },
  });

  // O token original será usado pela rota para configurar o cookie.
  // Ele não é armazenado no banco de dados.
  return {
    token,
    expiraEm,
  };
}


/**
 * Valida o token da sessão e retorna os dados do cliente
 * quando a sessão é válida.
 */
export async function validarSessaoCliente(token) {
  if (
    typeof token !== "string" ||
    !/^[a-f0-9]{64}$/.test(token)
  ) {
    return null;
  }

  const tokenHash = gerarHashToken(token);

  const sessao = await prisma.sessao_cliente.findUnique({
    where: {
      token_hash: tokenHash,
    },
    include: {
      cliente: {
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          email_verificado: true,
        },
      },
    },
  });

  if (!sessao) {
    return null;
  }

  // Sessões revogadas não podem ser utilizadas.
  if (sessao.revogado) {
    return null;
  }

  // Sessões expiradas não podem ser utilizadas.
  if (new Date() >= sessao.expira_em) {
    return null;
  }

  // Confirma que o cliente continua com o e-mail verificado.
  if (!sessao.cliente.email_verificado) {
    return null;
  }

  return {
    id: sessao.cliente.id,
    nome: sessao.cliente.nome,
    email: sessao.cliente.email,
    telefone: sessao.cliente.telefone,
    expiraEm: sessao.expira_em,
  };
}

/**
 * Revoga a sessão correspondente ao token recebido.
 */
export async function revogarSessaoCliente(token) {
  if (
    typeof token !== "string" ||
    !/^[a-f0-9]{64}$/.test(token)
  ) {
    return false;
  }

  const tokenHash = gerarHashToken(token);

  const resultado = await prisma.sessao_cliente.updateMany({
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
