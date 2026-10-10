import { createHmac } from "crypto";

export function gerarHashOTP(codigo) {
  const segredo = process.env.OTP_SECRET;

  if (!segredo) {
    throw new Error("OTP_SECRET não configurado");
  }

  return createHmac("sha256", segredo)
    .update(codigo)
    .digest("hex");
}