
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cadastroClienteSchema } from "@/lib/cliente-schema";
import { solicitarOTPCliente } from "@/lib/otp-cliente-service";

export async function POST(request) {
  try {
    const dados = await request.json();
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

    const { nome, email, telefone, produto_id } = validacao.data;

    const clienteExistente = await prisma.cliente.findUnique({
      where: { email },
    });

    if (clienteExistente) {
      return NextResponse.json(
        {
          mensagem: "Este e-mail já possui cadastro. Acesse a tela de login.",
        },
        { status: 409 }
      );
    }

    let cliente;
    let contatoCriado = null;

    // Cria o cliente e, quando houver produto associado,
    // registra também o interesse na tabela de contatos.
    const resultado = await prisma.$transaction(async (tx) => {
      if (produto_id != null) {
        const produto = await tx.produto.findUnique({
          where: { id: produto_id },
        });

        if (!produto) {
          throw new Error("PRODUTO_NAO_ENCONTRADO");
        }
      }

      const novoCliente = await tx.cliente.create({
        data: { nome, email, telefone },
      });

      let novoContato = null;

      if (produto_id != null) {
        const produto = await tx.produto.findUnique({
          where: { id: produto_id },
        });

        novoContato = await tx.contato.create({
          data: {
            nome,
            email,
            telefone,
            mensagem: `Interesse no produto: ${produto.nome}`,
            produto_id,
          },
        });
      }

      return {
        cliente: novoCliente,
        contato: novoContato,
      };
    });

    cliente = resultado.cliente;
    contatoCriado = resultado.contato;

    // Mantém o fluxo atual de envio do código OTP.
    try {
      const dadosOTP = await solicitarOTPCliente(cliente.id);

      return NextResponse.json(
        {
          mensagem:
            "Cadastro realizado. Confira seu e-mail para obter o código de confirmação.",
          ...dadosOTP,
        },
        { status: 201 }
      );
    } catch (erro) {
      // Se o envio do OTP falhar, desfaz os registros criados.
      await prisma.$transaction(async (tx) => {
        if (contatoCriado) {
          await tx.contato.delete({
            where: { id: contatoCriado.id },
          });
        }

        await tx.cliente.delete({
          where: { id: cliente.id },
        });
      });

      throw erro;
    }
  } catch (erro) {
    console.error("Erro ao cadastrar cliente:", erro);

    if (erro.message === "PRODUTO_NAO_ENCONTRADO") {
      return NextResponse.json(
        { mensagem: "O produto selecionado não foi encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { mensagem: "Não foi possível concluir o cadastro. Tente novamente." },
      { status: 500 }
    );
  }
}
