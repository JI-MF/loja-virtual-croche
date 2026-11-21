
import { describe, it, expect, vi, afterEach } from "vitest";
import { calcularExpiracaoOTP } from "@/lib/otp-expiracao";

describe("calcularExpiracaoOTP", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("deve definir a expiração para 5 minutos após a geração", () => {
    const agora = new Date("2026-11-10T20:00:00.000Z");

    vi.useFakeTimers();
    vi.setSystemTime(agora);

    const expiracao = calcularExpiracaoOTP();

    expect(expiracao.getTime()).toBe(
      agora.getTime() + 5 * 60 * 1000
    );
  });

  it("deve retornar uma instância de Date", () => {
    const expiracao = calcularExpiracaoOTP();

    expect(expiracao).toBeInstanceOf(Date);
  });
});
