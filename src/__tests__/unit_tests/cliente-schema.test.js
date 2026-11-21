
import { describe, it, expect } from "vitest";
import { cadastroClienteSchema } from "@/lib/cliente-schema";

describe("cadastroClienteSchema", () => {
  it("deve aceitar um cadastro com todos os dados válidos", () => {
    const dados = {
      nome: "Maria Silva",
      email: "maria@email.com",
      telefone: "(92) 99999-9999",
      produto_id: "10",
    };

    const resultado = cadastroClienteSchema.safeParse(dados);

    expect(resultado.success).toBe(true);

    expect(resultado.data).toEqual({
      nome: "Maria Silva",
      email: "maria@email.com",
      telefone: "92999999999",
      produto_id: 10,
    });
  });

  it("deve remover espaços extras do nome", () => {
    const resultado = cadastroClienteSchema.safeParse({
      nome: "  Maria Silva  ",
      email: "maria@email.com",
      telefone: "9299999999",
    });

    expect(resultado.success).toBe(true);
    expect(resultado.data.nome).toBe("Maria Silva");
  });

  it("deve rejeitar nomes com menos de 3 caracteres", () => {
    const resultado = cadastroClienteSchema.safeParse({
      nome: "Jo",
      email: "maria@email.com",
      telefone: "9299999999",
    });

    expect(resultado.success).toBe(false);
    expect(resultado.error.issues).toContainEqual(
      expect.objectContaining({
        message: "O nome deve ter pelo menos 3 caracteres.",
      })
    );
  });

  it("deve converter o e-mail para letras minúsculas e remover espaços", () => {
    const resultado = cadastroClienteSchema.safeParse({
      nome: "Maria Silva",
      email: "  MARIA@EMAIL.COM  ",
      telefone: "9299999999",
    });

    expect(resultado.success).toBe(true);
    expect(resultado.data.email).toBe("maria@email.com");
  });

  it("deve rejeitar um e-mail inválido", () => {
    const resultado = cadastroClienteSchema.safeParse({
      nome: "Maria Silva",
      email: "email-invalido",
      telefone: "9299999999",
    });

    expect(resultado.success).toBe(false);
  });

  it("deve remover caracteres não numéricos do telefone", () => {
    const resultado = cadastroClienteSchema.safeParse({
      nome: "Maria Silva",
      email: "maria@email.com",
      telefone: "(92) 99999-9999",
    });

    expect(resultado.success).toBe(true);
    expect(resultado.data.telefone).toBe("92999999999");
  });

  it("deve rejeitar telefone com menos de 10 dígitos", () => {
    const resultado = cadastroClienteSchema.safeParse({
      nome: "Maria Silva",
      email: "maria@email.com",
      telefone: "99999-999",
    });

    expect(resultado.success).toBe(false);
    expect(resultado.error.issues).toContainEqual(
      expect.objectContaining({
        message: "Digite um telefone válido.",
      })
    );
  });

  it("deve rejeitar telefone vazio", () => {
    const resultado = cadastroClienteSchema.safeParse({
      nome: "Maria Silva",
      email: "maria@email.com",
      telefone: "   ",
    });

    expect(resultado.success).toBe(false);
  });

  it("deve aceitar produto_id como número inteiro positivo", () => {
    const resultado = cadastroClienteSchema.safeParse({
      nome: "Maria Silva",
      email: "maria@email.com",
      telefone: "9299999999",
      produto_id: "15",
    });

    expect(resultado.success).toBe(true);
    expect(resultado.data.produto_id).toBe(15);
  });

  it("deve aceitar produto_id nulo", () => {
    const resultado = cadastroClienteSchema.safeParse({
      nome: "Maria Silva",
      email: "maria@email.com",
      telefone: "9299999999",
      produto_id: null,
    });

    expect(resultado.success).toBe(true);
    expect(resultado.data.produto_id).toBeNull();
  });

  it("deve aceitar produto_id omitido", () => {
    const resultado = cadastroClienteSchema.safeParse({
      nome: "Maria Silva",
      email: "maria@email.com",
      telefone: "9299999999",
    });

    expect(resultado.success).toBe(true);
    expect(resultado.data).not.toHaveProperty("produto_id");
  });

  it("deve rejeitar produto_id igual a zero ou negativo", () => {
    for (const produtoId of ["0", "-5"]) {
      const resultado = cadastroClienteSchema.safeParse({
        nome: "Maria Silva",
        email: "maria@email.com",
        telefone: "9299999999",
        produto_id: produtoId,
      });

      expect(resultado.success).toBe(false);
    }
  });

  it("deve rejeitar produto_id decimal", () => {
    const resultado = cadastroClienteSchema.safeParse({
      nome: "Maria Silva",
      email: "maria@email.com",
      telefone: "9299999999",
      produto_id: "1.5",
    });

    expect(resultado.success).toBe(false);
  });
});
