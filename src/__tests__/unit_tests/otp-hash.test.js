
import { describe, it, expect, afterEach } from "vitest";
import { gerarHashOTP } from "@/lib/otp-hash";

describe("gerarHashOTP", () => {
  const segredoOriginal = process.env.OTP_SECRET;

  afterEach(() => {
    if (segredoOriginal === undefined) {
      delete process.env.OTP_SECRET;
    } else {
      process.env.OTP_SECRET = segredoOriginal;
    }
  });

  it("deve gerar um hash hexadecimal de 64 caracteres", () => {
    process.env.OTP_SECRET = "segredo-teste";

    const hash = gerarHashOTP("123456");

    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("deve gerar o mesmo hash para o mesmo código e segredo", () => {
    process.env.OTP_SECRET = "segredo-teste";

    const primeiroHash = gerarHashOTP("123456");
    const segundoHash = gerarHashOTP("123456");

    expect(primeiroHash).toBe(segundoHash);
  });

  it("deve gerar hashes diferentes para códigos diferentes", () => {
    process.env.OTP_SECRET = "segredo-teste";

    const primeiroHash = gerarHashOTP("123456");
    const segundoHash = gerarHashOTP("654321");

    expect(primeiroHash).not.toBe(segundoHash);
  });

  it("deve lançar um erro quando OTP_SECRET não estiver configurado", () => {
    delete process.env.OTP_SECRET;

    expect(() => gerarHashOTP("123456")).toThrow(
      "OTP_SECRET não configurado"
    );
  });
});
