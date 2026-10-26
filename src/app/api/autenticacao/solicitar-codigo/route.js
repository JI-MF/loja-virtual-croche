
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { solicitarOTPCliente } from "@/lib/otp-cliente-service";

export async function POST(request) {
  try {
    // 1. Ler os dados enviados pelo Postman.
    let dados;

    try {
      dados = await request.json();
    } catch {
      return NextResponse.json(
        { mensagem: "Envie um JSON válido." },
        { status: 400 }
      );
    }

    // 2. Validar e normalizar o e-mail.
    const email =
      typeof dados.email === "string"
        ? dados.email.trim().toLowerCase()
        : "";

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!emailValido) {
      return NextResponse.json(
        { mensagem: "Informe um e-mail válido." },
        { status: 400 }
      );
    }

    // 3. Localizar o cliente.
    const cliente = await prisma.cliente.findUnique({
      where: { email },
    });

    // Não revelar diretamente se o e-mail está cadastrado.
    if (!cliente) {
      return NextResponse.json(
        {
          mensagem:
            "Se o e-mail estiver cadastrado, você receberá um código.",
        },
        { status: 200 }
      );
    }

    // 4. Solicitar o OTP usando o serviço existente.
    await solicitarOTPCliente(cliente.id);

    // 5. Retornar uma resposta sem expor o código.
    return NextResponse.json(
      {
        mensagem:
          "Se o e-mail estiver cadastrado, você receberá um código.",
      },
      { status: 200 }
    );
  } catch (erro) {
    // 6. Tratar o limite de reenvio.
    if (
      erro.message ===
      "Aguarde 60 segundos antes de solicitar outro código."
    ) {
      return NextResponse.json(
        { mensagem: erro.message },
        { status: 429 }
      );
    }

    console.error("Erro ao solicitar OTP do cliente:", erro);

    return NextResponse.json(
      { mensagem: "Não foi possível solicitar o código." },
      { status: 500 }
    );
  }
}
