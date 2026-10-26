
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { cadastroClienteSchema } from "@/lib/cliente-schema";
import { solicitarOTPCliente } from "@/lib/otp-cliente-service";

export async function POST(request) {
  try {
    const dados = await request.json();

    // 1. Validar os dados recebidos.
    const validacao = cadastroClienteSchema.safeParse(dados);

    if (!validacao.success) {
      return NextResponse.json(
        {
          mensagem: "Verifique os dados informados.",
          erros: validacao.error.issues.map((erro) => ({
            campo: erro.path.join("."),
            mensagem: erro.message,
          })),
        },
        { status: 400 }
      );
    }

    const { nome, email, telefone } = validacao.data;

    // 2. Verificar se o e-mail já está cadastrado.
    const clienteExistente = await prisma.cliente.findUnique({
      where: { email },
    });

    if (clienteExistente) {
      return NextResponse.json(
        {
          mensagem:
            "Este e-mail já possui cadastro. Acesse a tela de login.",
        },
        { status: 409 }
      );
    }

    // 3. Criar o cliente.
    const cliente = await prisma.cliente.create({
      data: {
        nome,
        email,
        telefone,
      },
    });

    // 4. Solicitar o código de confirmação por e-mail.
    try {
      await solicitarOTPCliente(cliente.id);
    } catch (erro) {
      // Se não for possível enviar o OTP, não deixamos
      // um cadastro incompleto para o usuário tentar repetir.
      await prisma.cliente.delete({
        where: { id: cliente.id },
      });

      throw erro;
    }

    return NextResponse.json(
      {
        mensagem:
          "Cadastro realizado. Confira seu e-mail para obter o código de confirmação.",
      },
      { status: 201 }
    );
  } catch (erro) {
    console.error("Erro ao cadastrar cliente:", erro);

    return NextResponse.json(
      {
        mensagem:
          "Não foi possível concluir o cadastro. Tente novamente.",
      },
      { status: 500 }
    );
  }
}
