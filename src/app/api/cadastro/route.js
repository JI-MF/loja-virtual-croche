import { cadastroSchema } from "@/lib/cadastro-schema";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const data = await request.json();

    const resultado = cadastroSchema.safeParse(data);

    if (!resultado.success) {
      const erros = resultado.error.issues.map((issue) => ({
        campo: issue.path[0],
        mensagem: issue.message,
      }));

      return Response.json(
        {
          erro: "Dados inválidos",
          campos: erros,
        },
        {
          status: 400,
        }
      );
    }

    const contato = await prisma.contato.create({
      data: {
        nome: resultado.data.nome,
        email: resultado.data.email,
        telefone: resultado.data.telefone,
        mensagem: resultado.data.mensagem,
      },
    });

    return Response.json(
      {
        mensagem: "Cadastro realizado com sucesso",
        contato: contato,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Erro ao cadastrar:", error);

    return Response.json(
      {
        erro: "Erro interno do servidor",
      },
      {
        status: 500,
      }
    );
  }
}