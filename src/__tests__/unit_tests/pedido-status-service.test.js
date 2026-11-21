import { describe, expect, it } from "vitest";

import {
  podeAlterarStatus,
  obterProximosStatus,
} from "@/lib/pedido-status-service";

describe("pedido-status-service", () => {
  // =========================
  // podeAlterarStatus
  // =========================

  describe("podeAlterarStatus", () => {
    it.each([
      ["PENDENTE", "CONFIRMADO"],
      ["PENDENTE", "CANCELADO"],
      ["CONFIRMADO", "ENVIADO"],
      ["ENVIADO", "ENTREGUE"],
    ])(
      "deve retornar true quando a transição de %s para %s for permitida",
      (statusAtual, novoStatus) => {
        expect(
          podeAlterarStatus(statusAtual, novoStatus)
        ).toBe(true);
      }
    );

    it.each([
      ["PENDENTE", "ENVIADO"],
      ["PENDENTE", "ENTREGUE"],
      ["CONFIRMADO", "CANCELADO"],
      ["ENVIADO", "CANCELADO"],
      ["ENTREGUE", "CONFIRMADO"],
      ["CANCELADO", "PENDENTE"],
    ])(
      "deve retornar false quando a transição de %s para %s não for permitida",
      (statusAtual, novoStatus) => {
        expect(
          podeAlterarStatus(statusAtual, novoStatus)
        ).toBe(false);
      }
    );

    it("deve retornar false quando o status atual for inválido", () => {
      expect(
        podeAlterarStatus("INVALIDO", "CONFIRMADO")
      ).toBe(false);
    });

    it("deve retornar false quando o novo status for inválido", () => {
      expect(
        podeAlterarStatus("PENDENTE", "INVALIDO")
      ).toBe(false);
    });
  });

  // =========================
  // obterProximosStatus
  // =========================

  describe("obterProximosStatus", () => {
    it.each([
      ["PENDENTE", ["CONFIRMADO", "CANCELADO"]],
      ["CONFIRMADO", ["ENVIADO"]],
      ["ENVIADO", ["ENTREGUE"]],
      ["ENTREGUE", []],
      ["CANCELADO", []],
    ])(
      "deve retornar os próximos status permitidos para %s",
      (statusAtual, statusEsperados) => {
        expect(
          obterProximosStatus(statusAtual)
        ).toEqual(statusEsperados);
      }
    );

    it("deve retornar uma lista vazia quando o status for inválido", () => {
      expect(
        obterProximosStatus("INVALIDO")
      ).toEqual([]);
    });
  });
});
