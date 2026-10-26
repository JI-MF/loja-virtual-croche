
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { revogarSessaoCliente } from "@/lib/sessao-cliente-service";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sessao_cliente")?.value;

    // Prepara a resposta que removerá o cookie.
    const resposta = NextResponse.json(
      { mensagem: "Logout realizado com sucesso." },
      { status: 200 }
    );

    // Revoga a sessão correspondente no banco.
    if (token) {
      await revogarSessaoCliente(token);
    }

    // Remove o cookie do navegador.
    resposta.cookies.set("sessao_cliente", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });

    return resposta;
  } catch (erro) {
    console.error("Erro ao realizar logout:", erro);

    return NextResponse.json(
      { mensagem: "Não foi possível realizar o logout." },
      { status: 500 }
    );
  }
}
