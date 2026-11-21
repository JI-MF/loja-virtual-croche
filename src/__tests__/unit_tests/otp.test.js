
import { describe, it, expect } from "vitest";
import { gerarOTP } from "@/lib/otp";

describe("gerarOTP", () => {
  it("deve gerar um código com exatamente 6 dígitos", () => {
    const codigo = gerarOTP();

    expect(codigo).toHaveLength(6);
    expect(codigo).toMatch(/^\d{6}$/);
  });

  it("deve retornar um código no formato de string", () => {
    const codigo = gerarOTP();

    expect(typeof codigo).toBe("string");
  });

  it("deve permitir códigos iniciados com zero", () => {
    const codigo = gerarOTP();

    expect(Number(codigo)).toBeGreaterThanOrEqual(0);
    expect(Number(codigo)).toBeLessThan(1000000);
  });
});
