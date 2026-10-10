import { validarOTP } from "@/lib/otp-validacao";

export async function POST(request) {
  try {
    const data = await request.json();

    const { contato_id, codigo } = data;

    // Validação do contato
    if (!Number.isInteger(contato_id) || contato_id <= 0) {
      return Response.json(
        {
          erro: "contato_id inválido",
        },
        {
          status: 400,
        }
      );
    }

    // Validação do código
    if (
      typeof codigo !== "string" ||
      !/^\d{6}$/.test(codigo)
    ) {
      return Response.json(
        {
          erro: "O código deve possuir exatamente 6 dígitos.",
        },
        {
          status: 400,
        }
      );
    }

    // Valida o OTP
    const resultado = await validarOTP(contato_id, codigo);

    // Código inválido, expirado ou limite de tentativas
    if (!resultado.sucesso) {
      return Response.json(
        resultado,
        {
          status: 400,
        }
      );
    }

    // Código válido
    return Response.json(
      resultado,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro ao validar OTP:", error);

    return Response.json(
      {
        erro: "Erro interno do servidor",
      },
      {
        status: 500,
      }
    );
  }
}