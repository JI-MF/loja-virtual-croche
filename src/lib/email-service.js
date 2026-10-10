import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function enviarOTP(email, codigo) {
  const { data, error } = await resend.emails.send({
    from: "Produções da Vick <onboarding@resend.dev>",
    to: [email],
    subject: "Código de verificação - Produções da Vick",
    html: `
      <h2>Verificação de e-mail</h2>

      <p>Olá!</p>

      <p>
        Seu código de verificação é:
      </p>

      <h1>${codigo}</h1>

      <p>
        Este código é válido por 5 minutos.
      </p>

      <p>
        Se você não solicitou este código, ignore este e-mail.
      </p>
    `,
  });

  if (error) {
    throw new Error(`Erro ao enviar e-mail: ${error.message}`);
  }

  return data;
}