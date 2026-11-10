
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/admin-auth-guard";
import {
  podeAlterarStatus,
  obterProximosStatus,
} from "@/lib/pedido-status-service";

const statusPedidoValidos = [
  "PENDENTE",
  "CONFIRMADO",
  "ENVIADO",
  "ENTREGUE",
  "CANCELADO",
];

async function obterId(params) {
  const { id } = await params;
  const idPedido = Number(id);

  if (!Number.isInteger(idPedido) || idPedido < 1) {
    return null;
  }

  return idPedido;
}

export async function GET(request, { params }) {
  try {
    const { resposta } = await exigirAdmin();

    if (resposta) {
      return resposta;
    }

    const id = await obterId(params);

    if (!id) {
      return NextResponse.json(
        { mensagem: "ID do pedido inválido." },
        { status: 400 }
      );
    }

    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        cliente: true,

        item_pedido: {
          include: {
            produto: true,
          },
        },

        pagamento: {
          include: {
            tentativas: true,
          },
        },
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { mensagem: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      pedido,
      proximosStatus: obterProximosStatus(pedido.status),
    });
  } catch (erro) {
    console.error("Erro ao consultar detalhes do pedido:", erro);

    return NextResponse.json(
      { mensagem: "Não foi possível consultar os detalhes do pedido." },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { resposta } = await exigirAdmin();

    if (resposta) {
      return resposta;
    }

    const id = await obterId(params);

    if (!id) {
      return NextResponse.json(
        { mensagem: "ID do pedido inválido." },
        { status: 400 }
      );
    }

    const corpo = await request.json();
    const novoStatus = corpo.status;

    if (!statusPedidoValidos.includes(novoStatus)) {
      return NextResponse.json(
        { mensagem: "Status do pedido inválido." },
        { status: 400 }
      );
    }

    const pedido = await prisma.pedido.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { mensagem: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    if (!podeAlterarStatus(pedido.status, novoStatus)) {
      return NextResponse.json(
        {
          mensagem: "Essa transição de status não é permitida.",
          statusAtual: pedido.status,
          proximosStatus: obterProximosStatus(pedido.status),
        },
        { status: 400 }
      );
    }

    const resultado = await prisma.pedido.updateMany({
      where: {
        id,
        status: pedido.status,
      },
      data: {
        status: novoStatus,
      },
    });

    if (resultado.count === 0) {
      return NextResponse.json(
        {
          mensagem: "O pedido foi atualizado por outra operação. Consulte novamente.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      mensagem: "Status do pedido atualizado com sucesso.",
      pedido: {
        id,
        status: novoStatus,
      },
      proximosStatus: obterProximosStatus(novoStatus),
    });
  } catch (erro) {
    console.error("Erro ao atualizar status do pedido:", erro);

    return NextResponse.json(
      { mensagem: "Não foi possível atualizar o status do pedido." },
      { status: 500 }
    );
  }
}
