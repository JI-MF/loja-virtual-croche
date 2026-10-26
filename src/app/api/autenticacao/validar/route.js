
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { validarOTPCliente } from "@/lib/otp-cliente-service";
import { criarSessaoCliente } from "@/lib/sessao-cliente-service";

export async function POST(request) {
  try {
    const dados = await request.json();

    const email =
      typeof dados.email === "string"
        ? dados.email.trim().toLowerCase()
        : "";

    const codigo =
      typeof dados.codigo === "string"
        ? dados.codigo.trim()
        : "";

    // 1. Validar os dados recebidos.
    if (!email || !/^\d{6}$/.test(codigo)) {
      return NextResponse.json(
        {
          mensagem:
            "Informe um e-mail válido e um código de seis dígitos.",
        },
        { status: 400 }
      );
    }

    // 2. Localizar o cliente.
    const cliente = await prisma.cliente.findUnique({
      where: { email },
    });

    if (!cliente) {
      return NextResponse.json(
        {
          mensagem: "Não foi possível validar o código.",
        },
        { status: 400 }
      );
    }

    // 3. Validar o OTP.
    const resultado = await validarOTPCliente(
      cliente.id,
      codigo
    );

    if (!resultado.sucesso) {
      return NextResponse.json(
        { mensagem: resultado.mensagem },
        { status: 400 }
      );
    }

    // 4. Criar uma sessão autenticada.
    const sessao = await criarSessaoCliente(cliente.id);

    // 5. Preparar a resposta e configurar o cookie.
    const resposta = NextResponse.json(
      {
        mensagem: "Autenticação realizada com sucesso.",
      },
      { status: 200 }
    );

    resposta.cookies.set("sessao_cliente", sessao.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: sessao.expiraEm,
    });

    return resposta;
  } catch (erro) {
    console.error("Erro na autenticação do cliente:", erro);

    return NextResponse.json(
      {
        mensagem: "Não foi possível concluir a autenticação.",
      },
      { status: 500 }
    );
  }
}
