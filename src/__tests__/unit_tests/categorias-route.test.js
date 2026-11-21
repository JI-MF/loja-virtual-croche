
import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    categoria: {
      findMany,
    },
  },
}));

import { GET } from "@/app/api/categorias/route";

describe("GET /api/categorias", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar as categorias com status 200", async () => {
    const categorias = [
      { id: 1, nome: "Bolsas" },
      { id: 2, nome: "Blusas" },
      { id: 3, nome: "Vestidos" },
    ];

    findMany.mockResolvedValue(categorias);

    const response = await GET();
    const dados = await response.json();

    expect(response.status).toBe(200);
    expect(dados).toEqual(categorias);

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      orderBy: {
        nome: "asc",
      },
    });
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
      erro: "Erro ao buscar categorias",
    });

    expect(findMany).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });
});
