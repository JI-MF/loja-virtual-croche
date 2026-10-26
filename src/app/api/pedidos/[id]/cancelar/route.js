
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validarSessaoCliente } from "@/lib/sessao-cliente-service";

class ErroCancelamento extends Error {
    constructor(mensagem, status) {
        super(mensagem);
        this.status = status;
    }
}

export async function POST(request, { params }) {
    // 1. Validar o identificador do pedido
    const { id } = await params;
    const pedidoId = Number(id);

    if (!Number.isSafeInteger(pedidoId) || pedidoId <= 0) {
        return NextResponse.json(
            { erro: "Identificador do pedido inválido." },
            { status: 400 }
        );
    }

    // 2. Validar a sessão do cliente
    const cookieStore = await cookies();
    const token = cookieStore.get("sessao_cliente")?.value;

    if (!token) {
        return NextResponse.json(
            { erro: "É necessário estar autenticado para cancelar um pedido." },
            { status: 401 }
        );
    }

    let cliente;

    try {
        cliente = await validarSessaoCliente(token);
    } catch (error) {
        console.error("Erro ao validar a sessão:", error);

        return NextResponse.json(
            { erro: "Não foi possível validar a sessão." },
            { status: 500 }
        );
    }

    if (!cliente) {
        const resposta = NextResponse.json(
            { erro: "Sessão inválida ou expirada. Entre novamente." },
            { status: 401 }
        );

        resposta.cookies.set("sessao_cliente", "", {
            httpOnly: true,
            path: "/",
            maxAge: 0
        });

        return resposta;
    }

    // 3. Cancelar o pedido e devolver o estoque
    try {
        const pedidoCancelado = await prisma.$transaction(async (tx) => {
            // Buscar somente um pedido pertencente ao cliente
            const pedido = await tx.pedido.findFirst({
                where: {
                    id: pedidoId,
                    cliente_id: cliente.id
                },
                include: {
                    item_pedido: true
                }
            });

            if (!pedido) {
                throw new ErroCancelamento(
                    "Pedido não encontrado.",
                    404
                );
            }

            if (pedido.status !== "PENDENTE") {
                throw new ErroCancelamento(
                    "Somente pedidos pendentes podem ser cancelados.",
                    409
                );
            }

            // Alterar o status somente se ainda estiver pendente
            const resultado = await tx.pedido.updateMany({
                where: {
                    id: pedidoId,
                    cliente_id: cliente.id,
                    status: "PENDENTE"
                },
                data: {
                    status: "CANCELADO"
                }
            });

            // Impedir cancelamento duplicado em requisições concorrentes
            if (resultado.count !== 1) {
                throw new ErroCancelamento(
                    "O pedido já foi alterado. Consulte seu status atual.",
                    409
                );
            }

            // Devolver ao estoque as quantidades reservadas
            for (const item of pedido.item_pedido) {
                await tx.produto.update({
                    where: {
                        id: item.produto_id
                    },
                    data: {
                        estoque: {
                            increment: item.quantidade
                        }
                    }
                });
            }

            // Retornar o pedido atualizado
            return tx.pedido.findUnique({
                where: {
                    id: pedidoId
                },
                include: {
                    item_pedido: {
                        include: {
                            produto: {
                                select: {
                                    id: true,
                                    nome: true
                                }
                            }
                        }
                    }
                }
            });
        });

        return NextResponse.json(
            {
                mensagem: "Pedido cancelado e estoque devolvido com sucesso.",
                pedido: pedidoCancelado
            },
            { status: 200 }
        );
    } catch (error) {
        if (error instanceof ErroCancelamento) {
            return NextResponse.json(
                { erro: error.message },
                { status: error.status }
            );
        }

        console.error("Erro ao cancelar pedido:", error);

        return NextResponse.json(
            { erro: "Não foi possível cancelar o pedido." },
            { status: 500 }
        );
    }
}
