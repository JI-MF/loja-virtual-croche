import { z } from "zod";

export const cadastroClienteSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, { error: "O nome deve ter pelo menos 3 caracteres." }),

  email: z
    .email({ error: "Digite um e-mail válido." })
    .trim()
    .toLowerCase()
    .pipe(z.email("Digite um email válido")),

  
telefone: z
  .string()
  .trim()
  .min(1, { error: "O telefone é obrigatório." })
  .refine(
    (telefone) => telefone.replace(/\D/g, "").length >= 10,
    { error: "Digite um telefone válido." }
  )
  .transform((telefone) => telefone.replace(/\D/g, "")),

});
