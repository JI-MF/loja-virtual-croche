import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/admin-auth-guard";

const statusPedidoValidos = [
  "PENDENTE",
  "CONFIRMADO",
  "ENVIADO",
  "ENTREGUE",
  "CANCELADO",
];

const statusPagamentoValidos = [
  "PENDENTE",
  "EM_PROCESSAMENTO",
  "APROVADO",
  "RECUSADO",
  "CANCELADO",
  "ESTORNADO",
  "EM_DISPUTA",
];

export async function GET(request) {
  try {
    const { resposta } = await exigirAdmin();

    if (resposta) {
      return resposta;
    }

    const { searchParams } = new URL(request.url);

    const busca = (searchParams.get("busca") || "").trim();
    const status = searchParams.get("status");
    const statusPagamento = searchParams.get("statusPagamento");

    const pagina = Number(searchParams.get("pagina") ?? 1);
    const limite = Number(searchParams.get("limite") ?? 10);

    if (!Number.isInteger(pagina) || pagina < 1) {
      return NextResponse.json(
        { mensagem: "O número da página deve ser um inteiro positivo." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(limite) || limite < 1 || limite > 100) {
      return NextResponse.json(
        { mensagem: "O limite deve ser um número entre 1 e 100." },
        { status: 400 }
      );
    }

    if (status && !statusPedidoValidos.includes(status)) {
      return NextResponse.json(
        { mensagem: "Status do pedido inválido." },
        { status: 400 }
      );
    }

    if (
      statusPagamento &&
      !statusPagamentoValidos.includes(statusPagamento)
    ) {
      return NextResponse.json(
        { mensagem: "Status do pagamento inválido." },
        { status: 400 }
      );
    }

    const where = {};

    if (status) {
      where.status = status;
    }

    if (statusPagamento) {
      where.pagamento = {
        some: {
          status: statusPagamento,
        },
      };
    }

    if (busca) {
      const condicoesBusca = [
        {
          cliente: {
            is: {
              nome: {
                contains: busca,
              },
            },
          },
        },
        {
          cliente: {
            is: {
              email: {
                contains: busca,
              },
            },
          },
        },
      ];

      if (/^\d+$/.test(busca)) {
        condicoesBusca.push({
          id: Number(busca),
        });
      }

      where.OR = condicoesBusca;
    }

    const [pedidos, total] = await prisma.$transaction([
      prisma.pedido.findMany({
        where,
        select: {
          id: true,
          data_pedido: true,
          status: true,
          valor_total: true,
          email_confirmacao_enviado: true,

          cliente: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true,
            },
          },

          item_pedido: {
            select: {
              id: true,
              quantidade: true,
              preco_unitario: true,
              produto: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },

          pagamento: {
            select: {
              id: true,
              status: true,
              valor: true,
              provedor: true,
              criado_em: true,
              atualizado_em: true,
            },
          },
        },
        orderBy: {
          data_pedido: "desc",
        },
        skip: (pagina - 1) * limite,
        take: limite,
      }),

      prisma.pedido.count({
        where,
      }),
    ]);

    return NextResponse.json({
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
      pedidos,
    });
  } catch (erro) {
    console.error("Erro ao consultar pedidos administrativos:", erro);

    return NextResponse.json(
      { mensagem: "Não foi possível consultar os pedidos." },
      { status: 500 }
    );
  }
}
