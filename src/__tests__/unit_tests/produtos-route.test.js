
import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    produto: {
      findMany,
    },
  },
}));

import { GET } from "@/app/api/produtos/route";

describe("GET /api/produtos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar os produtos com status 200", async () => {
    const produtos = [
      { id: 1, nome: "Bolsa de crochê", preco: 120 },
      { id: 2, nome: "Blusa de crochê", preco: 150 },
    ];

    findMany.mockResolvedValue(produtos);

    const response = await GET();
    const dados = await response.json();

    expect(response.status).toBe(200);
    expect(dados).toEqual(produtos);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith();
  });

  it("deve retornar status 500 quando ocorrer um erro na consulta", async () => {
    findMany.mockRejectedValue(
      new Error("Erro no banco de dados")
    );

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const response = await GET();
    const dados = await response.json();

    expect(response.status).toBe(500);
    expect(dados).toEqual({
      erro: "Erro ao buscar produtos",
    });

    expect(findMany).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });
});
