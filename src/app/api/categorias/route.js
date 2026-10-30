
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: {
        nome: "asc",
      },
    });

    return Response.json(categorias, {
      status: 200,
    });
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);

    return Response.json(
      {
        erro: "Erro ao buscar categorias",
      },
      {
        status: 500,
      }
    );
  }
}
