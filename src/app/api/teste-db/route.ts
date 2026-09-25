import { prisma } from "@/lib/prisma";

export async function GET() {
  const categorias = await prisma.categoria.findMany();

  return Response.json(categorias);
}