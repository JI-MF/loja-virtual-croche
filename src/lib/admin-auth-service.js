
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { criarSessaoAdmin } from "@/lib/sessao-admin-service";

// Valida o e-mail e a senha do administrador.
export async function autenticarAdmin(email, senha) {
  if (
    typeof email !== "string" ||
    typeof senha !== "string" ||
    !email.trim() ||
    !senha
  ) {
    return null;
  }

  const admin = await prisma.admin.findUnique({
    where: {
      email: email.trim().toLowerCase(),
    },
  });

  if (!admin || !admin.ativo) {
    return null;
  }

  const senhaValida = await bcrypt.compare(
    senha,
    admin.senha_hash
  );

  if (!senhaValida) {
    return null;
  }

  const sessao = await criarSessaoAdmin(admin.id);

  return {
    id: admin.id,
    nome: admin.nome,
    email: admin.email,
    token: sessao.token,
    expiraEm: sessao.expiraEm,
  };
}
