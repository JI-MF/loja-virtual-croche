
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/admin-auth-guard";

export async function GET(request) {
  try {
    const { resposta } = await exigirAdmin();

    if (resposta) {
      return resposta;
    }

    const { searchParams } = new URL(request.url);

    const busca = searchParams.get("busca")?.trim() || "";
    const verificado = searchParams.get("verificado");
    const pagina = Number(searchParams.get("pagina") || 1);
    const limite = Number(searchParams.get("limite") || 10);

    if (
      !Number.isInteger(pagina) ||
      pagina < 1 ||
      !Number.isInteger(limite) ||
      limite < 1 ||
      limite > 100
    ) {
      return NextResponse.json(
        { mensagem: "Parâmetros de paginação inválidos." },
        { status: 400 }
      );
    }

    if (
      verificado !== null &&
      verificado !== "true" &&
      verificado !== "false"
    ) {
      return NextResponse.json(
        { mensagem: "O filtro de verificação deve ser true ou false." },
        { status: 400 }
      );
    }

    const filtros = {
      ...(busca && {
        OR: [
          {
            nome: {
              contains: busca,
            },
          },
          {
            email: {
              contains: busca,
            },
          },
        ],
      }),

      ...(verificado !== null && {
        email_verificado: verificado === "true",
      }),
    };

    const [leads, total] = await prisma.$transaction([
      prisma.contato.findMany({
        where: filtros,
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          mensagem: true,
          produto_id: true,
          criado_em: true,
          email_verificado: true,
          produto: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
        orderBy: {
          criado_em: "desc",
        },
        skip: (pagina - 1) * limite,
        take: limite,
      }),

      prisma.contato.count({
        where: filtros,
      }),
    ]);

    return NextResponse.json(
      {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
        leads,
      },
      { status: 200 }
    );
  } catch (erro) {
    console.error("Erro ao buscar leads administrativos:", erro);

    return NextResponse.json(
      { mensagem: "Não foi possível consultar os leads." },
      { status: 500 }
    );
  }
}
