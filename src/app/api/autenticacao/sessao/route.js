
import { NextResponse } from "next/server";

import { cookies } from "next/headers";
import { validarSessaoCliente } from "@/lib/sessao-cliente-service";

export async function GET() {
  try {
    // 1. Ler o cookie da sessão.
    const cookieStore = await cookies();
    const token = cookieStore.get("sessao_cliente")?.value;

    if (!token) {
      return NextResponse.json(
        { mensagem: "Cliente não autenticado." },
        { status: 401 }
      );
    }

    // 2. Validar a sessão no banco de dados.
    const cliente = await validarSessaoCliente(token);

    if (!cliente) {
      const resposta = NextResponse.json(
        { mensagem: "Sessão inválida ou expirada." },
        { status: 401 }
      );

      resposta.cookies.set("sessao_cliente", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: new Date(0),
      });

      return resposta;
    }

    // 3. Retornar somente os dados básicos do cliente.
    return NextResponse.json(
      {
        autenticado: true,
        cliente,
      },
      { status: 200 }
    );
  } catch (erro) {
    console.error("Erro ao consultar sessão:", erro);

    return NextResponse.json(
      { mensagem: "Não foi possível consultar a sessão." },
      { status: 500 }
    );
  }
}
