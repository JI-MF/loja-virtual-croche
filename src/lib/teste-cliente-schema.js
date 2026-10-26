
import { clienteSchema } from "@/lib/cliente-schema";

const resultado = clienteSchema.safeParse({
  nome: "  Maria Silva  ",
  email: "MARIA@EMAIL.COM",
  telefone: "(92) 99999-1234",
});

if (resultado.success) {
  console.log("Dados válidos:");
  console.log(resultado.data);
} else {
  console.log("Erros de validação:");
  console.log(resultado.error.issues);
}
