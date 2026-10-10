import { reenviarOTP } from "@/lib/otp-service";

export async function POST(request) {
  try {
    const data = await request.json();

    const { contato_id } = data;

    // Validação do contato_id
    if (!Number.isInteger(contato_id) || contato_id <= 0) {
      return Response.json(
        {
          erro: "contato_id inválido.",
        },
        {
          status: 400,
        }
      );
    }

    // Reenvia o OTP
    await reenviarOTP(contato_id);

    return Response.json(
      {
        mensagem: "Novo código enviado com sucesso.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro ao reenviar OTP:", error);

    return Response.json(
      {
        erro: error.message || "Erro ao reenviar código.",
      },
      {
        status: 400,
      }
    );
  }
}