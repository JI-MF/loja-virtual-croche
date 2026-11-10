import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { validarSessaoAdmin } from "@/lib/sessao-admin-service";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sessao_admin")?.value;

    const admin = await validarSessaoAdmin(token);

    if (!admin) {
      const resposta = NextResponse.json(
        { autenticado: false, mensagem: "Sessão administrativa inválida ou expirada." },
        { status: 401 }
      );

      resposta.cookies.set("sessao_admin", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });

      return resposta;
    }

    return NextResponse.json(
      {
        autenticado: true,
        admin: {
          id: admin.id,
          nome: admin.nome,
          email: admin.email,
        },
      },
      { status: 200 }
    );
  } catch (erro) {
    console.error("Erro ao verificar sessão administrativa:", erro);

    return NextResponse.json(
      { mensagem: "Não foi possível verificar a sessão administrativa." },
      { status: 500 }
    );
  }
}
