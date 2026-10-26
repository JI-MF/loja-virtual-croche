
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validarSessaoCliente } from "@/lib/sessao-cliente-service";

export async function GET() {
    // 1. Validar a sessão do cliente
    const cookieStore = await cookies();
    const token = cookieStore.get("sessao_cliente")?.value;

    if (!token) {
        return NextResponse.json(
            { erro: "É necessário estar autenticado para consultar os pedidos." },
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

    // 2. Consultar somente os pedidos do cliente autenticado
    try {
        const pedidos = await prisma.pedido.findMany({
            where: {
                cliente_id: cliente.id
            },
            orderBy: {
                data_pedido: "desc"
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
                }, pagamento: true
            }
        });

        return NextResponse.json(
            {
                mensagem: "Pedidos consultados com sucesso.",
                pedidos
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Erro ao consultar pedidos:", error);

        return NextResponse.json(
            { erro: "Não foi possível consultar os pedidos." },
            { status: 500 }
        );
    }
}

class ErroPedido extends Error {
    constructor(mensagem, status) {
        super(mensagem);
        this.status = status;
    }
}

export async function POST(request) {
    // 1. Validar a sessão do cliente
    const cookieStore = await cookies();
    const token = cookieStore.get("sessao_cliente")?.value;

    if (!token) {
        return NextResponse.json(
            { erro: "É necessário estar autenticado para criar um pedido." },
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

    // 2. Ler e validar os dados enviados
    let corpo;

    try {
        corpo = await request.json();
    } catch {
        return NextResponse.json(
            { erro: "O corpo da requisição deve conter um JSON válido." },
            { status: 400 }
        );
    }

    const itensRecebidos = corpo?.itens;

    if (
        !Array.isArray(itensRecebidos) ||
        itensRecebidos.length === 0 ||
        itensRecebidos.length > 50
    ) {
        return NextResponse.json(
            { erro: "Informe entre 1 e 50 itens no pedido." },
            { status: 400 }
        );
    }

    // 3. Validar e agrupar os produtos
    const quantidades = new Map();

    for (const item of itensRecebidos) {
        if (
            !item ||
            !Number.isSafeInteger(item.produto_id) ||
            item.produto_id <= 0 ||
            !Number.isSafeInteger(item.quantidade) ||
            item.quantidade <= 0
        ) {
            return NextResponse.json(
                {
                    erro: "Cada item deve possuir um produto_id e uma quantidade válidos."
                },
                { status: 400 }
            );
        }

        const quantidadeAtual = quantidades.get(item.produto_id) ?? 0;
        const novaQuantidade = quantidadeAtual + item.quantidade;

        if (!Number.isSafeInteger(novaQuantidade)) {
            return NextResponse.json(
                { erro: "Quantidade de produtos inválida." },
                { status: 400 }
            );
        }

        quantidades.set(item.produto_id, novaQuantidade);
    }

    try {
        // 4. Criar pedido e reservar estoque em uma transação
        const pedidoCriado = await prisma.$transaction(async (tx) => {
            const idsProdutos = [...quantidades.keys()];

            const produtos = await tx.produto.findMany({
                where: {
                    id: { in: idsProdutos }
                }
            });

            if (produtos.length !== idsProdutos.length) {
                throw new ErroPedido(
                    "Um ou mais produtos não foram encontrados.",
                    400
                );
            }

            const produtosPorId = new Map(
                produtos.map((produto) => [produto.id, produto])
            );

            let totalCentavos = 0;
            const itensParaCriar = [];

            for (const [produtoId, quantidade] of quantidades) {
                const produto = produtosPorId.get(produtoId);

                if (produto.estoque < quantidade) {
                    throw new ErroPedido(
                        `Estoque insuficiente para o produto: ${produto.nome}.`,
                        409
                    );
                }

                // Calcular em centavos para evitar erros de ponto flutuante
                const precoCentavos = Math.round(
                    Number(produto.preco) * 100
                );

                totalCentavos += precoCentavos * quantidade;

                if (!Number.isSafeInteger(totalCentavos)) {
                    throw new ErroPedido(
                        "O valor total do pedido é inválido.",
                        400
                    );
                }

                itensParaCriar.push({
                    produto_id: produto.id,
                    quantidade,
                    preco_unitario: produto.preco
                });
            }

            // Reservar o estoque com uma condição atômica
            for (const [produtoId, quantidade] of quantidades) {
                const resultado = await tx.produto.updateMany({
                    where: {
                        id: produtoId,
                        estoque: { gte: quantidade }
                    },
                    data: {
                        estoque: { decrement: quantidade }
                    }
                });

                if (resultado.count !== 1) {
                    throw new ErroPedido(
                        "Estoque insuficiente. Atualize o carrinho e tente novamente.",
                        409
                    );
                }
            }

            // Registrar o pedido e seus itens
            return tx.pedido.create({
                data: {
                    cliente_id: cliente.id,
                    status: "PENDENTE",
                    valor_total: (totalCentavos / 100).toFixed(2),
                    item_pedido: {
                        create: itensParaCriar
                    }
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
                mensagem: "Pedido criado com sucesso.",
                pedido: pedidoCriado
            },
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof ErroPedido) {
            return NextResponse.json(
                { erro: error.message },
                { status: error.status }
            );
        }

        console.error("Erro ao criar pedido:", error);

        return NextResponse.json(
            { erro: "Não foi possível criar o pedido." },
            { status: 500 }
        );
    }
}
