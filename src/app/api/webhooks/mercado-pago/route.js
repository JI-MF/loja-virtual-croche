
// import { NextResponse } from "next/server";
// import {
//     WebhookSignatureValidator,
//     InvalidWebhookSignatureError,
// } from "mercadopago";

// import { prisma } from "@/lib/prisma";
// import { consultarOrderMercadoPago } from "@/lib/mercado-pago-service";

// function mapearStatusPagamento(status) {
//     switch (status) {
//         case "created":
//             return "PENDENTE";

//         case "processing":
//         case "action_required":
//             return "EM_PROCESSAMENTO";

//         case "processed":
//             return "APROVADO";

//         case "failed":
//             return "RECUSADO";

//         case "canceled":
//             return "CANCELADO";

//         case "refunded":
//             return "ESTORNADO";

//         case "charged_back":
//             return "EM_DISPUTA";

//         default:
//             return null;
//     }
// }


// function podeAtualizarStatusPagamento(atual, novo) {
//     if (atual === novo) {
//         return true;
//     }

//     const transicoesPermitidas = {
//         PENDENTE: [
//             "EM_PROCESSAMENTO",
//             "APROVADO",
//             "RECUSADO",
//             "CANCELADO",
//         ],

//         EM_PROCESSAMENTO: [
//             "APROVADO",
//             "RECUSADO",
//             "CANCELADO",
//         ],

//         APROVADO: [
//             "ESTORNADO",
//             "EM_DISPUTA",
//         ],

//         RECUSADO: [],

//         CANCELADO: [],

//         ESTORNADO: [
//             "EM_DISPUTA",
//         ],

//         EM_DISPUTA: [
//             "ESTORNADO",
//         ],
//     };

//     return transicoesPermitidas[atual]?.includes(novo) ?? false;
// }


// export async function POST(request) {
//     const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

//     if (!secret) {
//         console.error("Chave secreta do webhook não configurada.");

//         return NextResponse.json(
//             { erro: "Configuração interna indisponível." },
//             { status: 500 }
//         );
//     }

//     const xSignature = request.headers.get("x-signature");
//     const xRequestId = request.headers.get("x-request-id");
//     const dataId = request.nextUrl.searchParams.get("data.id");
//     const tipo = request.nextUrl.searchParams.get("type");

//     if (!xSignature || !xRequestId || !dataId) {
//         return NextResponse.json(
//             { erro: "Dados de validação ausentes." },
//             { status: 400 }
//         );
//     }

//     try {
//         WebhookSignatureValidator.validate({
//             xSignature,
//             xRequestId,
//             dataId,
//             secret,
//             toleranceSeconds: 300,
//         });
//     } catch (error) {
//         if (error instanceof InvalidWebhookSignatureError) {
//             return NextResponse.json(
//                 { erro: "Assinatura inválida." },
//                 { status: 401 }
//             );
//         }

//         console.error("Falha interna ao validar assinatura.");

//         return NextResponse.json(
//             { erro: "Não foi possível validar a notificação." },
//             { status: 500 }
//         );
//     }

//     // Esta rota trata somente notificações de ordens.
//     if (!["order", "orders", "orders_v2"].includes(tipo)) {
//         return NextResponse.json(
//             { mensagem: "Tipo de notificação não tratado." },
//             { status: 200 }
//         );
//     }

//     try {
//         // Consultar o estado atual diretamente no Mercado Pago.
//         const ordem = await consultarOrderMercadoPago(dataId);

//         // Localizar o pagamento associado a essa ordem.
//         const pagamento = await prisma.pagamento.findUnique({
//             where: {
//                 mercado_pago_order_id: String(dataId),
//             },
//             include: {
//                 pedido: true,
//             },
//         });

//         if (!pagamento) {
//             console.warn(
//                 "Ordem recebida sem pagamento local correspondente.",
//                 { dataId }
//             );

//             // Permite nova tentativa caso o registro ainda não exista.
//             return NextResponse.json(
//                 { erro: "Pagamento local não encontrado." },
//                 { status: 500 }
//             );
//         }

//         // Confirmar que a ordem corresponde ao pedido local.
//         if (
//             String(ordem.external_reference) !==
//             String(pagamento.pedido_id)
//         ) {
//             console.error("Referência externa não corresponde ao pedido.", {
//                 dataId,
//                 pagamentoId: pagamento.id,
//             });

//             return NextResponse.json(
//                 { mensagem: "Referência não corresponde ao pedido." },
//                 { status: 200 }
//             );
//         }

//         // Conferir o valor antes de alterar qualquer estado.
//         const valorMercadoPago = Math.round(
//             Number(ordem.total_amount) * 100
//         );

//         const valorLocal = Math.round(
//             Number(pagamento.valor) * 100
//         );

//         if (
//             !Number.isFinite(valorMercadoPago) ||
//             valorMercadoPago !== valorLocal ||
//             (ordem.currency_id && ordem.currency_id !== "BRL")
//         ) {
//             console.error("Valor ou moeda da ordem não corresponde.", {
//                 dataId,
//                 pagamentoId: pagamento.id,
//             });

//             return NextResponse.json(
//                 { mensagem: "Dados da ordem precisam ser verificados." },
//                 { status: 200 }
//             );
//         }

        
//         const novoStatus = mapearStatusPagamento(ordem.status);

//         // Não tratar um reembolso parcial como pagamento integralmente aprovado.
//         if (
//             ordem.status === "processed" &&
//             ordem.status_detail === "partially_refunded"
//         ) {
//             console.warn(
//                 "Ordem com reembolso parcial. Atualização automática de status ignorada.",
//                 { dataId }
//             );

//             return NextResponse.json(
//                 {
//                     mensagem:
//                         "Ordem com reembolso parcial; atualização requer análise."
//                 },
//                 { status: 200 }
//             );
//         }


        
        
//         // Atualizar pagamento e pedido na mesma transação.
//         await prisma.$transaction(async (tx) => {
//             // Buscar o estado mais recente do pagamento.
//             const pagamentoAtual = await tx.pagamento.findUnique({
//                 where: {
//                     id: pagamento.id,
//                 },
//             });

//             if (!pagamentoAtual) {
//                 throw new Error("Pagamento local não encontrado.");
//             }

//             // Buscar o estado atual do pedido antes de atualizar o pagamento.
//             const pedidoAtual = await tx.pedido.findUnique({
//                 where: {
//                     id: pagamento.pedido_id,
//                 },
//             });

//             if (!pedidoAtual) {
//                 throw new Error("Pedido local não encontrado.");
//             }

//             // Não aprovar automaticamente um pagamento de pedido cancelado.
//             if (
//                 novoStatus === "APROVADO" &&
//                 pedidoAtual.status === "CANCELADO"
//             ) {
//                 console.error(
//                     "Pagamento aprovado para um pedido cancelado. É necessária análise manual.",
//                     {
//                         pagamentoId: pagamentoAtual.id,
//                         pedidoId: pedidoAtual.id,
//                         dataId,
//                     }
//                 );

//                 return;
//             }

//             // Não permitir transições de estado inválidas.
//             const transicaoPermitida = podeAtualizarStatusPagamento(
//                 pagamentoAtual.status,
//                 novoStatus
//             );

//             if (!transicaoPermitida) {
//                 console.warn("Transição de pagamento ignorada.", {
//                     pagamentoId: pagamentoAtual.id,
//                     statusAtual: pagamentoAtual.status,
//                     statusRecebido: novoStatus,
//                 });

//                 return;
//             }

//             // Atualizar somente se o status continuar igual ao consultado.
//             const resultadoAtualizacao = await tx.pagamento.updateMany({
//                 where: {
//                     id: pagamentoAtual.id,
//                     status: pagamentoAtual.status,
//                 },
//                 data: {
//                     status: novoStatus,
//                 },
//             });

//             // Se outra operação alterou o pagamento, não continuar.
//             if (resultadoAtualizacao.count === 0) {
//                 console.warn(
//                     "Pagamento alterado por outra operação. Atualização ignorada.",
//                     {
//                         pagamentoId: pagamentoAtual.id,
//                         statusEsperado: pagamentoAtual.status,
//                         statusRecebido: novoStatus,
//                     }
//                 );

//                 return;
//             }

//             // Confirmar apenas pedidos que ainda estão pendentes.
//             if (
//                 novoStatus === "APROVADO" &&
//                 pedidoAtual.status === "PENDENTE"
//             ) {
//                 await tx.pedido.update({
//                     where: {
//                         id: pedidoAtual.id,
//                     },
//                     data: {
//                         status: "CONFIRMADO",
//                     },
//                 });
//             }
//         });



//         console.info("Notificação processada.", {
//             dataId,
//             statusPagamento: novoStatus,
//         });

//         return NextResponse.json(
//             { mensagem: "Notificação processada." },
//             { status: 200 }
//         );
//     } catch (error) {
//         console.error("Erro ao processar webhook.", {
//             dataId,
//             erro: 
//                 error instanceof Error
//                     ? error.message
//                     : "Erro desconhecido",
//         });

//         return NextResponse.json(
//             { erro: "Falha ao processar a notificação." },
//             { status: 500 }
//         );
//     }
// }


import { NextResponse } from "next/server";
import {
    WebhookSignatureValidator,
    InvalidWebhookSignatureError,
} from "mercadopago";

import { prisma } from "@/lib/prisma";
import { consultarOrderMercadoPago } from "@/lib/mercado-pago-service";
import { enviarConfirmacaoPedido } from "@/lib/email-service";

function mapearStatusPagamento(status) {
    switch (status) {
        case "created":
            return "PENDENTE";

        case "processing":
        case "action_required":
            return "EM_PROCESSAMENTO";

        case "processed":
            return "APROVADO";

        case "failed":
            return "RECUSADO";

        case "canceled":
            return "CANCELADO";

        case "refunded":
            return "ESTORNADO";

        case "charged_back":
            return "EM_DISPUTA";

        default:
            return null;
    }
}

function podeAtualizarStatusPagamento(atual, novo) {
    if (atual === novo) return true;

    const transicoesPermitidas = {
        PENDENTE: [
            "EM_PROCESSAMENTO",
            "APROVADO",
            "RECUSADO",
            "CANCELADO",
        ],
        EM_PROCESSAMENTO: [
            "APROVADO",
            "RECUSADO",
            "CANCELADO",
        ],
        APROVADO: ["ESTORNADO", "EM_DISPUTA"],
        RECUSADO: [],
        CANCELADO: [],
        ESTORNADO: ["EM_DISPUTA"],
        EM_DISPUTA: ["ESTORNADO"],
    };

    return transicoesPermitidas[atual]?.includes(novo) ?? false;
}

export async function POST(request) {
    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

    if (!secret) {
        console.error("Chave secreta do webhook não configurada.");

        return NextResponse.json(
            { erro: "Configuração interna indisponível." },
            { status: 500 }
        );
    }

    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");
    const dataId = request.nextUrl.searchParams.get("data.id");
    const tipo = request.nextUrl.searchParams.get("type");

    if (!xSignature || !xRequestId || !dataId) {
        return NextResponse.json(
            { erro: "Dados de validação ausentes." },
            { status: 400 }
        );
    }


    try {
        WebhookSignatureValidator.validate({
            xSignature,
            xRequestId,
            dataId,
            secret,
            toleranceSeconds: 300,
        });
    } catch (error) {
        if (error instanceof InvalidWebhookSignatureError) {
            return NextResponse.json(
                { erro: "Assinatura inválida." },
                { status: 401 }
            );
        }

        console.error("Falha interna ao validar assinatura.");

        return NextResponse.json(
            { erro: "Não foi possível validar a notificação." },
            { status: 500 }
        );
    }

    if (!["order", "orders", "orders_v2"].includes(tipo)) {
        return NextResponse.json(
            { mensagem: "Tipo de notificação não tratado." },
            { status: 200 }
        );
    }

    try {
        // 1. Consultar a ordem diretamente no Mercado Pago.
        const ordem = await consultarOrderMercadoPago(dataId);

        console.log("Status atual da ordem no Mercado Pago:", {
            id: ordem.id,
            status: ordem.status,
            status_detail: ordem.status_detail,
            total_amount: ordem.total_amount,
            currency: ordem.currency,
            external_reference: ordem.external_reference,
        });

        // 2. Encontrar a tentativa correspondente à ordem.
        const tentativa = await prisma.tentativa_pagamento.findUnique({
            where: {
                mercado_pago_order_id: String(dataId),
            },
            include: {
                pagamento: {
                    include: {
                        pedido: true,
                    },
                },
            },
        });

        if (!tentativa) {
            console.warn(
                "Ordem sem tentativa de pagamento local correspondente.",
                { dataId }
            );

            // O registro pode ainda não ter sido concluído.
            return NextResponse.json(
                { erro: "Tentativa de pagamento não encontrada." },
                { status: 500 }
            );
        }

        const pagamento = tentativa.pagamento;

        // 3. Validar a referência do pedido.
        if (
            String(ordem.external_reference) !==
            String(pagamento.pedido_id)
        ) {
            console.error(
                "Referência externa não corresponde ao pedido.",
                {
                    dataId,
                    pagamentoId: pagamento.id,
                    tentativaId: tentativa.id,
                }
            );

            return NextResponse.json(
                { mensagem: "Referência não corresponde ao pedido." },
                { status: 200 }
            );
        }

        // 4. Conferir o valor desta tentativa e a moeda.
        const valorMercadoPago = Math.round(
            Number(ordem.total_amount) * 100
        );

        const valorTentativa = Math.round(
            Number(tentativa.valor) * 100
        );

        
if (
    !Number.isFinite(valorMercadoPago) ||
    !Number.isFinite(valorTentativa) ||
    valorMercadoPago !== valorTentativa ||
    ordem.currency !== "BRL"
) {
    console.error("Valor ou moeda da ordem não corresponde.", {
        dataId,
        pagamentoId: pagamento.id,
        tentativaId: tentativa.id,
        moedaRecebida: ordem.currency ?? null,
    });

    return NextResponse.json(
        { mensagem: "Dados da ordem precisam ser verificados." },
        { status: 200 }
    );
}

        const novoStatus = mapearStatusPagamento(ordem.status);

        if (!novoStatus) {
            console.info("Status da ordem ainda não tratado.", {
                dataId,
                statusMercadoPago: ordem.status,
            });

            return NextResponse.json(
                { mensagem: "Status da ordem não tratado." },
                { status: 200 }
            );
        }

        // Não tratar um reembolso parcial como reembolso integral.
        if (
            ordem.status === "processed" &&
            ordem.status_detail === "partially_refunded"
        ) {
            console.warn(
                "Ordem com reembolso parcial; análise manual necessária.",
                { dataId, tentativaId: tentativa.id }
            );

            return NextResponse.json(
                {
                    mensagem:
                        "Reembolso parcial; atualização requer análise.",
                },
                { status: 200 }
            );
        }

        // 5. Atualizar a tentativa e, quando apropriado,
        // sincronizar o pagamento principal.
        const resultadoProcessamento = await prisma.$transaction(async (tx) => {
            const tentativaAtual =
                await tx.tentativa_pagamento.findUnique({
                    where: { id: tentativa.id },
                });

            if (!tentativaAtual) {
                throw new Error("Tentativa de pagamento não encontrada.");
            }

            const pagamentoAtual = await tx.pagamento.findUnique({
                where: { id: pagamento.id },
            });

            if (!pagamentoAtual) {
                throw new Error("Pagamento local não encontrado.");
            }

            const pedidoAtual = await tx.pedido.findUnique({
                where: { id: pagamento.pedido_id },
            });

            if (!pedidoAtual) {
                throw new Error("Pedido local não encontrado.");
            }

            // Verificar se esta ainda é a tentativa mais recente.
            const tentativaMaisRecente =
                await tx.tentativa_pagamento.findFirst({
                    where: { pagamento_id: pagamento.id },
                    orderBy: { id: "desc" },
                    select: { id: true },
                });

            const estaAtual =
                tentativaMaisRecente?.id === tentativaAtual.id;

            // Não permitir transições inválidas na tentativa.
            // Não atualizar a tentativa para APROVADO se o pedido foi cancelado.
            if (
                novoStatus === "APROVADO" &&
                pedidoAtual.status === "CANCELADO"
            ) {
                console.error(
                    "Pagamento aprovado para pedido cancelado. Análise manual necessária.",
                    {
                        pagamentoId: pagamentoAtual.id,
                        pedidoId: pedidoAtual.id,
                        tentativaId: tentativaAtual.id,
                    }
                );

                return { atualizado: false, motivo: "transicao_pagamento_ignorada" };
            }
            const transicaoTentativaPermitida =
                podeAtualizarStatusPagamento(
                    tentativaAtual.status,
                    novoStatus
                );

            if (!transicaoTentativaPermitida) {
                console.warn("Transição da tentativa ignorada.", {
                    tentativaId: tentativaAtual.id,
                    statusAtual: tentativaAtual.status,
                    statusRecebido: novoStatus,
                });

                return { atualizado: false, motivo: "transicao_tentativa_ignorada" };
            }

            // Atualizar a tentativa correspondente à ordem recebida.
            const resultadoTentativa =
                await tx.tentativa_pagamento.updateMany({
                    where: {
                        id: tentativaAtual.id,
                        status: tentativaAtual.status,
                    },
                    data: { status: novoStatus },
                });

            if (resultadoTentativa.count === 0) {
                throw new Error(
                    "Conflito na tentativa de pagamento."
                );
            }

            // Uma tentativa antiga não deve alterar o pagamento principal.
            if (!estaAtual) {
                console.warn(
                    "Tentativa antiga atualizada; pagamento principal preservado.",
                    {
                        tentativaId: tentativaAtual.id,
                        pagamentoId: pagamentoAtual.id,
                        statusRecebido: novoStatus,
                    }
                );

                if (novoStatus === "APROVADO") {
                    console.error(
                        "ATENÇÃO: tentativa antiga aprovada. "
                        + "Verificar possível cobrança duplicada.",
                        {
                            tentativaId: tentativaAtual.id,
                            pagamentoId: pagamentoAtual.id,
                            pedidoId: pedidoAtual.id,
                        }
                    );
                }

                return { atualizado: false, motivo: "tentativa_antiga" };
            }

            // Se o pagamento já possui o status recebido, não repetir a atualização.
            if (pagamentoAtual.status === novoStatus) {
                console.info("Pagamento já possui o status recebido.", {
                    pagamentoId: pagamentoAtual.id,
                    status: novoStatus,
                });

                return { atualizado: false, motivo: "status_ja_aplicado" };
            }

            // Atualizar o pagamento principal respeitando as transições.
            const transicaoPagamentoPermitida =
                podeAtualizarStatusPagamento(
                    pagamentoAtual.status,
                    novoStatus
                );

            if (!transicaoPagamentoPermitida) {
                console.warn("Transição do pagamento ignorada.", {
                    pagamentoId: pagamentoAtual.id,
                    statusAtual: pagamentoAtual.status,
                    statusRecebido: novoStatus,
                });

                return { atualizado: false, motivo: "transicao_pagamento_ignorada" };
            }

            const resultadoPagamento =
                await tx.pagamento.updateMany({
                    where: {
                        id: pagamentoAtual.id,
                        status: pagamentoAtual.status,
                    },
                    data: { status: novoStatus },
                });

            if (resultadoPagamento.count === 0) {
                throw new Error(
                    "Conflito na atualização do pagamento principal."
                );
            }

            // Aprovar o pedido somente se ainda estiver pendente.
            if (
                novoStatus === "APROVADO" &&
                pedidoAtual.status === "PENDENTE"
            ) {
                await tx.pedido.update({
                    where: { id: pedidoAtual.id },
                    data: { status: "CONFIRMADO" },
                });
            }

            return { atualizado: true, motivo: "status_atualizado" };
        });

        if (resultadoProcessamento?.atualizado === false) {
            
            if (novoStatus === "APROVADO") {
                const pedidoEmail = await prisma.pedido.findUnique({
                    where: { id: pagamento.pedido_id },
                    include: {
                        cliente: true,
                        item_pedido: {
                            include: {
                                produto: true,
                            },
                        },
                    },
                });

                if (
                    pedidoEmail &&
                    pedidoEmail.status === "CONFIRMADO" &&
                    !pedidoEmail.email_confirmacao_enviado
                ) {
                    await enviarConfirmacaoPedido(
                        pedidoEmail.cliente.email,
                        pedidoEmail
                    );

                    await prisma.pedido.update({
                        where: { id: pedidoEmail.id },
                        data: { email_confirmacao_enviado: true },
                    });

                    console.info("E-mail de confirmação enviado.", {
                        pedidoId: pedidoEmail.id,
                    });
                }
            }

            console.info("Notificação recebida, mas atualização ignorada.", {
                dataId,
                tentativaId: tentativa.id,
                pagamentoId: pagamento.id,
                motivo: resultadoProcessamento.motivo,
            });
            } else {
                console.info("Notificação processada.", {
                    dataId,
                    tentativaId: tentativa.id,
                    pagamentoId: pagamento.id,
                    statusPagamento: novoStatus,
                });
            }

        return NextResponse.json(
            { mensagem: "Notificação processada." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Erro ao processar webhook.", {
            dataId,
            erro:
                error instanceof Error
                    ? error.message
                    : "Erro desconhecido",
        });

        return NextResponse.json(
            { erro: "Falha ao processar a notificação." },
            { status: 500 }
        );
    }
}

