
import "dotenv/config";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { prisma } from "../src/lib/prisma.ts";

function perguntarSenha(mensagem) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
      reject(new Error("Execute o script em um terminal interativo."));
      return;
    }

    let senha = "";

    stdout.write(mensagem);
    stdin.setRawMode(true);
    stdin.resume();

    function finalizar() {
      stdin.removeListener("data", receberDados);
      stdin.setRawMode(false);
      stdout.write("\n");
    }

    
    function receberDados(dados) {
      for (const caractere of dados.toString()) {
        if (caractere === "\u0003") {
          finalizar();
          reject(new Error("Operação cancelada."));
          return;
        }

        if (caractere === "\r" || caractere === "\n") {
          finalizar();
          resolve(senha);
          return;
        }

        if (caractere === "\u007f" || caractere === "\b") {
          if (senha.length > 0) {
            senha = senha.slice(0, -1);
            stdout.write("\b \b");
          }
          continue;
        }

        if (caractere >= " " && caractere <= "~") {
          senha += caractere;
          stdout.write("*");
        }
      }
    }
    stdin.on("data", receberDados);
  });
}

async function main() {
  const terminal = readline.createInterface({
    input: stdin,
    output: stdout,
  });

  let nome;
  let email;

  try {
    nome = (await terminal.question("Nome do administrador: ")).trim();
    email = (await terminal.question("E-mail do administrador: "))
      .trim()
      .toLowerCase();
  } finally {
    terminal.close();
  }

  const senha = await perguntarSenha("Senha do administrador: ");

  if (!nome || !email || !senha) {
    throw new Error("Todos os campos são obrigatórios.");
  }

  if (senha.length < 12) {
    throw new Error("A senha deve possuir pelo menos 12 caracteres.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Informe um e-mail válido.");
  }

  const senhaHash = await bcrypt.hash(senha, 12);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: {
      nome,
      senha_hash: senhaHash,
      ativo: true,
    },
    create: {
      nome,
      email,
      senha_hash: senhaHash,
      ativo: true,
    },
    select: {
      id: true,
      nome: true,
      email: true,
    },
  });

  console.log("\nAdministrador cadastrado com sucesso!");
  console.log(`ID: ${admin.id}`);
  console.log(`Nome: ${admin.nome}`);
  console.log(`E-mail: ${admin.email}`);
}

main()
  .catch((erro) => {
    console.error("\nErro ao cadastrar administrador:", erro.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
