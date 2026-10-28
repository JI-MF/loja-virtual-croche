
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResultadoPagamentoConteudo() {
    const searchParams = useSearchParams();
    const pedidoId = searchParams.get("pedido");

    const [pedido, setPedido] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    
useEffect(() => {
    let ativo = true;
    let temporizador;

    async function consultarPedido() {
        if (!pedidoId || !/^[1-9]\d*$/.test(pedidoId)) {
            setErro("O identificador do pedido é inválido.");
            setCarregando(false);
            return;
        }

        let continuarConsultando = true;

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

            if (!ativo) return;

            setPedido(dados.pedido);
            setErro("");

            const pagamento = Array.isArray(dados.pedido.pagamento)
                ? dados.pedido.pagamento[0]
                : dados.pedido.pagamento;

            const status = pagamento?.status ?? "PENDENTE";

            continuarConsultando = [
                "PENDENTE",
                "EM_PROCESSAMENTO",
            ].includes(status);
        } catch (error) {
            if (ativo) {
                setErro(
                    error.message ||
                    "Ocorreu um erro ao consultar o pedido."
                );
            }
        } finally {
            if (ativo) setCarregando(false);
        }

        if (ativo && continuarConsultando) {
            temporizador = setTimeout(consultarPedido, 3000);
        }
    }

    consultarPedido();

    return () => {
        ativo = false;
        clearTimeout(temporizador);
    };
}, [pedidoId]);


    if (carregando) {
        return (
            <main className="mx-auto max-w-2xl px-6 py-16 text-center">
                <h1 className="text-2xl font-semibold">
                    Consultando seu pedido...
                </h1>
                <p className="mt-3 text-gray-600">
                    Aguarde enquanto verificamos as informações do pagamento.
                </p>
            </main>
        );
    }

    if (erro || !pedido) {
        return (
            <main className="mx-auto max-w-2xl px-6 py-16 text-center">
                <h1 className="text-2xl font-semibold">
                    Não foi possível consultar o pedido
                </h1>
                <p className="mt-3 text-gray-600">{erro || "Os dados do pedido não foram encontrados."}</p>
                <Link
                    href="/"
                    className="mt-8 inline-block rounded-lg bg-black px-5 py-3 text-white"
                >
                    Voltar à loja
                </Link>
            </main>
        );
    }

    const pagamento = Array.isArray(pedido.pagamento)
        ? pedido.pagamento[0]
        : pedido.pagamento;

    const statusPagamento = pagamento?.status ?? "PENDENTE";

    const resultado = {
        APROVADO: {
            titulo: "Pagamento aprovado!",
            mensagem: "Seu pedido foi confirmado com sucesso.",
        },
        RECUSADO: {
            titulo: "Pagamento recusado",
            mensagem: "Não foi possível aprovar seu pagamento.",
        },
        CANCELADO: {
            titulo: "Pagamento cancelado",
            mensagem: "O pagamento foi cancelado.",
        },
        ESTORNADO: {
            titulo: "Pagamento estornado",
            mensagem: "O pagamento foi estornado.",
        },
        EM_PROCESSAMENTO: {
            titulo: "Pagamento em processamento",
            mensagem: "Estamos aguardando a confirmação do pagamento.",
        },
        EM_DISPUTA: {
            titulo: "Pagamento em análise",
            mensagem: "O pagamento está em análise.",
        },
        PENDENTE: {
            titulo: "Pagamento pendente",
            mensagem: "Ainda estamos aguardando a confirmação do pagamento.",
        },
    }[statusPagamento] ?? {
        titulo: "Status não identificado",
        mensagem: "Consulte os detalhes do seu pedido para mais informações.",
    };

    return (
        <main className="mx-auto max-w-2xl px-6 py-16">
            <section className="rounded-2xl border p-8 text-center shadow-sm">
                <h1 className="text-3xl font-bold">{resultado.titulo}</h1>
                <p className="mt-4 text-gray-600">{resultado.mensagem}</p>

                <div className="mt-8 rounded-lg bg-gray-50 p-4 text-left">
                    <p><strong>Pedido:</strong> #{pedido.id}</p>
                    <p className="mt-2"><strong>Status do pedido:</strong> {pedido.status}</p>
                    <p className="mt-2"><strong>Status do pagamento:</strong> {statusPagamento}</p>
                    <p className="mt-2">
                        <strong>Valor total:</strong>{" "}
                        {Number(pedido.valor_total).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                        })}
                    </p>
                </div>

                {["PENDENTE", "EM_PROCESSAMENTO"].includes(statusPagamento) && (
                    <p className="mt-4 text-sm text-gray-600">
                        Esta página será atualizada automaticamente enquanto aguardamos a confirmação.
                    </p>
                )}

                <Link
                    href={`/pedido/${pedido.id}`}
                    className="mt-8 inline-block rounded-lg bg-black px-5 py-3 text-white"
                >
                    Ver detalhes do pedido
                </Link>

                <div>
                    <Link href="/" className="mt-4 inline-block text-gray-600 underline">
                        Voltar à loja
                    </Link>
                </div>
            </section>
        </main>
    );
}

export default function ResultadoPagamentoPage() {
    return (
        <Suspense
            fallback={
                <main className="mx-auto max-w-2xl px-6 py-16 text-center">
                    <h1 className="text-2xl font-semibold">
                        Carregando resultado do pagamento...
                    </h1>
                </main>
            }
        >
            <ResultadoPagamentoConteudo />
        </Suspense>
    );
}
