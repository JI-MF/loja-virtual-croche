import { z } from "zod";


export const cadastroSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, { error: "O nome é obrigatório" }),

  email: z.email("Digite um e-mail válido"),

  telefone: z
    .string()
    .trim()
    .min(1, { error: "O telefone é obrigatório" })
    .refine(
      (telefone) => telefone.replace(/\D/g, "").length >= 10,
      { error: "Digite um telefone válido" }
    ),

  mensagem: z
    .string()
    .trim()
    .min(10, { error: "A mensagem é obrigatória" }),
});