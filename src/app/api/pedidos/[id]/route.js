
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { validarSessaoCliente } from "@/lib/sessao-cliente-service";

export async function GET(request, { params }) {
  try {
    // 1. Validar o identificador do pedido.
    const { id } = await params;
    const pedidoId = Number(id);

    if (!Number.isSafeInteger(pedidoId) || pedidoId <= 0) {
      return NextResponse.json(
        { erro: "Identificador do pedido inválido." },
        { status: 400 }
      );
    }

    // 2. Recuperar a sessão do cliente.
    const cookieStore = await cookies();
    const token = cookieStore.get("sessao_cliente")?.value;

    if (!token) {
      return NextResponse.json(
        { erro: "É necessário estar autenticado para consultar o pedido." },
        { status: 401 }
      );
    }

    // 3. Validar a sessão.
    const cliente = await validarSessaoCliente(token);

    if (!cliente) {
      const resposta = NextResponse.json(
        { erro: "Sessão inválida ou expirada. Entre novamente." },
        { status: 401 }
      );

      resposta.cookies.set("sessao_cliente", "", {
        httpOnly: true,
        path: "/",
        maxAge: 0,
      });

      return resposta;
    }

    // 4. Consultar somente um pedido pertencente ao cliente.
    const pedido = await prisma.pedido.findFirst({
      where: {
        id: pedidoId,
        cliente_id: cliente.id,
      },
      select: {
        id: true,
        status: true,
        valor_total: true,
        data_pedido: true,
        item_pedido: {
          select: {
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
            criado_em: true,
            atualizado_em: true,
          },
        },
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { erro: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    // 5. Retornar os dados necessários para a interface.
    return NextResponse.json(
      {
        mensagem: "Pedido consultado com sucesso.",
        pedido,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao consultar pedido:", error);

    return NextResponse.json(
      { erro: "Não foi possível consultar o pedido." },
      { status: 500 }
    );
  }
}
