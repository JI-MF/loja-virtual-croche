
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

                const emailEnviado =
                    dados.pedido.email_confirmacao_enviado === true;

                continuarConsultando =
                    ["PENDENTE", "EM_PROCESSAMENTO"].includes(status) ||
                    (status === "APROVADO" && !emailEnviado);

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

    const formatarValor = (valor) =>
        Number(valor).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });

    if (carregando) {
        return (
            <main className="flex min-h-screen w-full items-center justify-center bg-[#f8f3ef] px-4 py-10">
                <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-lg shadow-[#94664f]/10 sm:p-12">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f5ebe5]">
                        <svg
                            className="h-8 w-8 animate-spin text-[#94664f]"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <circle
                                cx="12"
                                cy="12"
                                r="9"
                                stroke="currentColor"
                                strokeWidth="3"
                                className="opacity-20"
                            />
                            <path
                                d="M21 12a9 9 0 0 0-9-9"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>

                    <h1 className="mt-6 text-2xl font-bold text-[#543d32]">
                        Consultando seu pedido...
                    </h1>

                    <p className="mt-3 text-sm leading-relaxed text-gray-500">
                        Aguarde enquanto verificamos as informações do pagamento.
                    </p>
                </section>
            </main>
        );
    }

    if (erro || !pedido) {
        return (
            <main className="flex min-h-screen w-full items-center justify-center bg-[#f8f3ef] px-4 py-10">
                <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-lg shadow-[#94664f]/10 sm:p-12">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                        <svg
                            className="h-8 w-8 text-red-500"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v4m0 4h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0Z"
                            />
                        </svg>
                    </div>

                    <h1 className="mt-6 text-2xl font-bold text-[#543d32]">
                        Não foi possível consultar o pedido
                    </h1>

                    <p className="mt-3 text-sm leading-relaxed text-gray-500">
                        {erro || "Os dados do pedido não foram encontrados."}
                    </p>

                    <Link
                        href="/"
                        className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-[#94664f] px-6 py-3.5 font-semibold text-white transition hover:bg-[#79513f]"
                    >
                        Voltar à loja
                    </Link>
                </section>
            </main>
        );
    }

    const pagamento = Array.isArray(pedido.pagamento)
        ? pedido.pagamento[0]
        : pedido.pagamento;

    const statusPagamento = pagamento?.status ?? "PENDENTE";

    const emailEnviado = pedido.email_confirmacao_enviado === true;

    const compraAprovada = statusPagamento === "APROVADO";

    const resultado = {
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

    const corStatus = compraAprovada
        ? "bg-green-50 text-green-700"
        : statusPagamento === "RECUSADO" ||
            statusPagamento === "CANCELADO"
            ? "bg-red-50 text-red-700"
            : "bg-amber-50 text-amber-700";

    return (
        <main className="flex min-h-screen w-full items-center justify-center bg-[#f8f3ef] px-4 py-10 sm:px-6">
            <section className="w-full max-w-xl overflow-hidden rounded-3xl border border-[#eaded6] bg-[#fffaf3] shadow-xl shadow-[#94664f]/10">

                <div className="px-6 pb-8 pt-10 text-center sm:px-10 sm:pt-12">

                    <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                        compraAprovada ? "bg-green-100" : "bg-[#f5ebe5]"
                    }`}>
                        {compraAprovada ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                className="h-11 w-11 text-green-600"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m5 12 4 4L19 6"
                                />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                className="h-10 w-10 text-[#94664f]"
                            >
                                <circle cx="12" cy="12" r="9" />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 7v5l3 2"
                                />
                            </svg>
                        )}
                    </div>

                    <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#94664f]">
                        Produções da Vick Crochê
                    </p>

                    <h1 className="mt-3 text-2xl font-bold leading-tight text-[#543d32] sm:text-3xl">
                        {compraAprovada
                            ? "Compra realizada com sucesso!"
                            : resultado.titulo}
                    </h1>

                    <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600 sm:text-base">
                        {compraAprovada
                            ? "Seu pagamento foi aprovado e seu pedido está confirmado. Obrigada por escolher nosso trabalho!"
                            : resultado.mensagem}
                    </p>

                    {compraAprovada && (
                        <div className="mt-7 rounded-2xl border border-green-100 bg-green-50 p-5 text-left">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
                                    {emailEnviado ? (
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="h-5 w-5 text-green-600"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="m5 12 4 4L19 6"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="h-5 w-5 text-[#94664f]"
                                        >
                                            <circle cx="12" cy="12" r="9" />
                                            <path d="M12 7v5l3 2" />
                                        </svg>
                                    )}
                                </div>

                                <div>
                                    <h2 className="font-bold text-green-800">
                                        {emailEnviado
                                            ? "E-mail de confirmação enviado!"
                                            : "Finalizando sua confirmação..."}
                                    </h2>

                                    <p className="mt-1 text-sm leading-relaxed text-green-700">
                                        {emailEnviado
                                            ? "Enviamos os detalhes da sua compra para o endereço de e-mail cadastrado. Verifique também sua caixa de spam."
                                            : "Seu pagamento foi aprovado. Estamos aguardando a confirmação do envio do e-mail."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t border-[#eee5df] bg-[#f3e9dc] px-6 py-7 sm:px-10">
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-[#543d32]">
                            Resumo do pedido
                        </h2>

                        <span className="rounded-full bg-[#f1e7e0] px-3 py-1 text-xs font-semibold text-[#79513f]">
                            #{pedido.id}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm text-gray-500">
                                Status do pedido
                            </span>
                            <span className="text-right text-sm font-semibold text-[#543d32]">
                                {pedido.status}
                            </span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm text-gray-500">
                                Status do pagamento
                            </span>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${corStatus}`}>
                                {statusPagamento}
                            </span>
                        </div>

                        <div className="border-t border-dashed border-[#e5d8cf] pt-4">
                            <div className="flex items-center justify-between gap-4">
                                <span className="font-semibold text-[#543d32]">
                                    Valor total
                                </span>
                                <span className="text-xl font-bold text-[#94664f]">
                                    {formatarValor(pedido.valor_total)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {["PENDENTE", "EM_PROCESSAMENTO"].includes(statusPagamento) && (
                        <p className="mt-5 text-center text-xs leading-relaxed text-gray-500">
                            Estamos verificando seu pagamento. Esta página será
                            atualizada automaticamente.
                        </p>
                    )}

                    {compraAprovada && !emailEnviado && (
                        <p className="mt-5 text-center text-xs leading-relaxed text-gray-500">
                            Estamos verificando a confirmação do envio do seu e-mail.
                        </p>
                    )}

                    <div className="mt-7 flex flex-col gap-3">
                        <Link
                            href={`/pedido/${pedido.id}`}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#657d59] px-6 py-4 text-center text-sm font-bold text-white shadow-md shadow-[#657d59]/20 transition hover:-translate-y-0.5 hover:bg-[#506849] hover:shadow-lg"
                        >
                            Visualizar dados do pedido

                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="h-4 w-4"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 12h14m-6-6 6 6-6 6"
                                />
                            </svg>
                        </Link>

                        <Link
                            href="/"
                            className="flex w-full items-center justify-center rounded-xl border border-[#d9c7ba] bg-[#fffaf3] px-6 py-3.5 text-center text-sm font-semibold text-[#657d59] transition hover:bg-[#f3e9dc]"
                        >
                            Voltar para a página inicial
                        </Link>
                    </div>
                </div>

                {compraAprovada && emailEnviado && (
                    <div className="border-t border-[#eee5df] px-6 py-5 text-center">
                        <p className="text-sm text-[#94664f]">
                            Feito à mão com carinho. Obrigada por comprar conosco!
                        </p>
                    </div>
                )}
            </section>
        </main>
    );
}

export default function ResultadoPagamentoPage() {
    return (
        <Suspense
            fallback={
                <main className="flex min-h-screen w-full items-center justify-center bg-[#f8f3ef] px-4 py-10">
                    <p className="text-center text-lg font-semibold text-[#543d32]">
                        Carregando resultado do pagamento...
                    </p>
                </main>
            }
        >
            <ResultadoPagamentoConteudo />
        </Suspense>
    );
}
