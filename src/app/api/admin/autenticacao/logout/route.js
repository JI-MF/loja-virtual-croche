import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { revogarSessaoAdmin } from "@/lib/sessao-admin-service";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sessao_admin")?.value;

    // Revoga a sessão no banco, caso exista um token.
    if (token) {
      await revogarSessaoAdmin(token);
    }

    // Remove o cookie do navegador.
    const resposta = NextResponse.json(
      { mensagem: "Logout administrativo realizado com sucesso." },
      { status: 200 }
    );

    resposta.cookies.set("sessao_admin", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return resposta;
  } catch (erro) {
    console.error("Erro ao realizar logout administrativo:", erro);

    return NextResponse.json(
      { mensagem: "Não foi possível realizar o logout administrativo." },
      { status: 500 }
    );
  }
}
