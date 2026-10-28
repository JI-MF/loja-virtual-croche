
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function DetalhesPedidoPage() {
    const params = useParams();
    const pedidoId = params.id;

    const [pedido, setPedido] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        async function consultarPedido() {
            if (
                typeof pedidoId !== "string" ||
                !/^[1-9]\d*$/.test(pedidoId)
            ) {
                setErro("O identificador do pedido é inválido.");
                setCarregando(false);
                return;
            }

            try {
                const resposta = await fetch(
                    `/api/pedidos/${pedidoId}`,
                    { cache: "no-store" }
                );

                const dados = await resposta.json();

                if (!resposta.ok) {
                    throw new Error(
                        dados.erro || "Não foi possível consultar o pedido."
                    );
                }

                setPedido(dados.pedido);
            } catch (error) {
                setErro(
                    error.message || "Ocorreu um erro ao consultar o pedido."
                );
            } finally {
                setCarregando(false);
            }
        }

        consultarPedido();
    }, [pedidoId]);

    function formatarMoeda(valor) {
        return Number(valor).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    }

    if (carregando) {
        return (
            <main className="mx-auto max-w-3xl px-6 py-12">
                <h1 className="text-2xl font-bold">
                    Carregando detalhes do pedido...
                </h1>
            </main>
        );
    }

    if (erro) {
        return (
            <main className="mx-auto max-w-3xl px-6 py-12">
                <h1 className="text-2xl font-bold">
                    Não foi possível consultar o pedido
                </h1>

                <p className="mt-4 text-gray-600">{erro}</p>

                <Link
                    href="/"
                    className="mt-6 inline-block underline"
                >
                    Voltar à loja
                </Link>
            </main>
        );
    }

    const pagamento = Array.isArray(pedido.pagamento)
        ? pedido.pagamento[0]
        : pedido.pagamento;

    const statusPedido = {
        PENDENTE: "Aguardando confirmação do pagamento",
        CONFIRMADO: "Pedido confirmado",
        ENVIADO: "Pedido enviado",
        ENTREGUE: "Pedido entregue",
        CANCELADO: "Pedido cancelado",
    };

    const statusPagamento = {
        PENDENTE: "Pagamento pendente",
        EM_PROCESSAMENTO: "Pagamento em processamento",
        APROVADO: "Pagamento aprovado",
        RECUSADO: "Pagamento recusado",
        CANCELADO: "Pagamento cancelado",
        ESTORNADO: "Pagamento estornado",
        EM_DISPUTA: "Pagamento em análise",
    };

    return (
        <main className="mx-auto max-w-3xl px-6 py-12">
            <h1 className="text-3xl font-bold">
                Detalhes do pedido #{pedido.id}
            </h1>

            <p className="mt-2 text-gray-600">
                Confira os produtos e o andamento do seu pedido.
            </p>

            <section className="mt-8 rounded-xl border p-6">
                <h2 className="text-xl font-semibold">
                    Informações do pedido
                </h2>

                <p className="mt-4">
                    <strong>Data:</strong>{" "}
                    {new Date(pedido.data_pedido).toLocaleString("pt-BR")}
                </p>

                <p className="mt-3">
                    <strong>Status:</strong>{" "}
                    {statusPedido[pedido.status] ?? pedido.status}
                </p>

                <p className="mt-3">
                    <strong>Pagamento:</strong>{" "}
                    {pagamento
                        ? statusPagamento[pagamento.status] ??
                          pagamento.status
                        : "Nenhum pagamento registrado"}
                </p>
            </section>

            <section className="mt-6 rounded-xl border p-6">
                <h2 className="text-xl font-semibold">
                    Produtos do pedido
                </h2>

                <div className="mt-4 space-y-4">
                    {pedido.item_pedido.map((item, indice) => (
                        <div
                            key={`${item.produto.id}-${indice}`}
                            className="border-b pb-4 last:border-b-0"
                        >
                            <p className="font-medium">
                                {item.produto.nome}
                            </p>

                            <p className="mt-1 text-sm text-gray-600">
                                Quantidade: {item.quantidade}
                            </p>

                            <p className="mt-1 text-sm text-gray-600">
                                Preço unitário:{" "}
                                {formatarMoeda(item.preco_unitario)}
                            </p>

                            <p className="mt-1 font-medium">
                                Subtotal:{" "}
                                {formatarMoeda(
                                    Number(item.preco_unitario) *
                                    item.quantidade
                                )}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-6 border-t pt-4 text-right">
                    <p className="text-lg font-bold">
                        Total: {formatarMoeda(pedido.valor_total)}
                    </p>
                </div>
            </section>

            <div className="mt-8 flex flex-wrap gap-4">
                <Link
                    href={`/pedido/resultado?pedido=${pedido.id}`}
                    className="rounded-lg bg-black px-5 py-3 text-white"
                >
                    Ver resultado do pagamento
                </Link>

                <Link
                    href="/"
                    className="rounded-lg border px-5 py-3"
                >
                    Voltar à loja
                </Link>
            </div>
        </main>
    );
}
