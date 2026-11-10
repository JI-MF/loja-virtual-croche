
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/admin-auth-guard";

export async function GET() {
  try {
    const { resposta } = await exigirAdmin();

    if (resposta) {
      return resposta;
    }

    const agora = new Date();

    // Período dos últimos seis meses, incluindo o mês atual.
    const inicioPeriodo = new Date(
      agora.getFullYear(),
      agora.getMonth() - 5,
      1
    );

    const [
      totalPedidos,
      pedidosPendentes,
      totalLeads,
      faturamento,
      distribuicaoStatus,
      pagamentosAprovados,
    ] = await Promise.all([
      prisma.pedido.count(),

      prisma.pedido.count({
        where: {
          status: "PENDENTE",
        },
      }),

      prisma.contato.count(),

      prisma.pagamento.aggregate({
        where: {
          status: "APROVADO",
        },
        _sum: {
          valor: true,
        },
      }),

      prisma.pedido.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      }),

      prisma.pagamento.findMany({
        where: {
          status: "APROVADO",
          pedido: {
            data_pedido: {
              gte: inicioPeriodo,
            },
          },
        },
        select: {
          valor: true,
          pedido: {
            select: {
              data_pedido: true,
            },
          },
        },
      }),
    ]);

    // Inicializa os seis meses, inclusive os que não possuem vendas.
    const vendasPorMes = Array.from(
      { length: 6 },
      (_, indice) => {
        const data = new Date(
          agora.getFullYear(),
          agora.getMonth() - 5 + indice,
          1
        );

        return {
          ano: data.getFullYear(),
          numeroMes: data.getMonth(),
          mes: data.toLocaleDateString("pt-BR", {
            month: "short",
            year: "numeric",
          }),
          total: 0,
        };
      }
    );

    // Distribui os pagamentos aprovados pelos meses dos pedidos.
    for (const pagamento of pagamentosAprovados) {
      const dataPedido = pagamento.pedido.data_pedido;

      const mesEncontrado = vendasPorMes.find(
        (item) =>
          item.ano === dataPedido.getFullYear() &&
          item.numeroMes === dataPedido.getMonth()
      );

      if (mesEncontrado) {
        mesEncontrado.total += Number(pagamento.valor);
      }
    }

    const pedidosPorStatus = distribuicaoStatus.map((item) => ({
      status: item.status,
      quantidade: item._count._all,
    }));

    return NextResponse.json(
      {
        indicadores: {
          totalPedidos,
          pedidosPendentes,
          totalLeads,
          faturamentoTotal: Number(
            faturamento._sum.valor || 0
          ),
        },
        vendasPorMes: vendasPorMes.map((item) => ({
          mes: item.mes,
          total: Number(item.total.toFixed(2)),
        })),
        pedidosPorStatus,
      },
      { status: 200 }
    );
  } catch (erro) {
    console.error("Erro ao buscar indicadores administrativos:", erro);

    return NextResponse.json(
      {
        mensagem: "Não foi possível carregar os indicadores do painel.",
      },
      { status: 500 }
    );
  }
}
