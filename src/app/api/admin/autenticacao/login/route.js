
import { NextResponse } from "next/server";

import { autenticarAdmin } from "@/lib/admin-auth-service";

export async function POST(request) {
  try {
    const dados = await request.json();

    const email =
      typeof dados.email === "string"
        ? dados.email.trim().toLowerCase()
        : "";

    const senha =
      typeof dados.senha === "string"
        ? dados.senha
        : "";

    // 1. Validar os dados recebidos.
    if (!email || !senha) {
      return NextResponse.json(
        {
          mensagem: "Informe o e-mail e a senha.",
        },
        { status: 400 }
      );
    }

    // 2. Validar as credenciais e criar a sessão.
    const admin = await autenticarAdmin(email, senha);

    if (!admin) {
      return NextResponse.json(
        {
          mensagem: "E-mail ou senha incorretos.",
        },
        { status: 401 }
      );
    }

    // 3. Preparar a resposta.
    const resposta = NextResponse.json(
      {
        mensagem: "Autenticação administrativa realizada com sucesso.",
        admin: {
          id: admin.id,
          nome: admin.nome,
          email: admin.email,
        },
      },
      { status: 200 }
    );

    // 4. Configurar o cookie administrativo.
    resposta.cookies.set("sessao_admin", admin.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: admin.expiraEm,
    });

    return resposta;
  } catch (erro) {
    console.error("Erro na autenticação administrativa:", erro);

    return NextResponse.json(
      {
        mensagem: "Não foi possível concluir a autenticação administrativa.",
      },
      { status: 500 }
    );
  }
}
