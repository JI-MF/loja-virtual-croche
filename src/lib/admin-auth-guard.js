
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { validarSessaoAdmin } from "@/lib/sessao-admin-service";

export async function exigirAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sessao_admin")?.value;

  const admin = await validarSessaoAdmin(token);

  if (!admin) {
    const resposta = NextResponse.json(
      {
        autenticado: false,
        mensagem: "Acesso não autorizado. Faça login para continuar.",
      },
      { status: 401 }
    );

    resposta.cookies.set("sessao_admin", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return {
      admin: null,
      resposta,
    };
  }

  return {
    admin,
    resposta: null,
  };
}
