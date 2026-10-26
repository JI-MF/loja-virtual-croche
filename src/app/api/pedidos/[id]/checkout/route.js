
// import { cookies } from "next/headers";
// import { NextResponse } from "next/server";
// import { randomUUID } from "node:crypto";

// import { prisma } from "@/lib/prisma";
// import { validarSessaoCliente } from "@/lib/sessao-cliente-service";
// import {
//     criarOrderMercadoPago,
//     consultarOrderMercadoPago,
// } from "@/lib/mercado-pago-service";

// export async function POST(request, { params }) {
//     // 1. Validar a sessão do cliente.
//     const cookieStore = await cookies();
//     const token = cookieStore.get("sessao_cliente")?.value;

//     if (!token) {
//         return NextResponse.json(
//             { erro: "Entre na sua conta para iniciar o pagamento." },
//             { status: 401 }
//         );
//     }

//     let cliente;

//     try {
//         cliente = await validarSessaoCliente(token);
//     } catch (error) {
//         console.error("Erro ao validar sessão:", error);

//         return NextResponse.json(
//             { erro: "Não foi possível validar a sessão." },
//             { status: 500 }
//         );
//     }

//     if (!cliente) {
//         const resposta = NextResponse.json(
//             { erro: "Sessão inválida ou expirada. Entre novamente." },
//             { status: 401 }
//         );

//         resposta.cookies.set("sessao_cliente", "", {
//             httpOnly: true,
//             path: "/",
//             maxAge: 0,
//         });

//         return resposta;
//     }

//     // 2. Validar o ID recebido pela URL.
//     const { id } = await params;
//     const pedidoId = Number(id);

//     if (!Number.isSafeInteger(pedidoId) || pedidoId <= 0) {
//         return NextResponse.json(
//             { erro: "ID do pedido inválido." },
//             { status: 400 }
//         );
//     }

//     try {
//         // 3. Consultar o pedido pertencente ao cliente autenticado.
//         const pedido = await prisma.pedido.findFirst({
//             where: {
//                 id: pedidoId,
//                 cliente_id: cliente.id,
//             },
//             include: {
//                 item_pedido: {
//                     include: {
//                         produto: {
//                             select: {
//                                 id: true,
//                                 nome: true,
//                             },
//                         },
//                     },
//                 },
//             },
//         });

//         if (!pedido) {
//             return NextResponse.json(
//                 { erro: "Pedido não encontrado." },
//                 { status: 404 }
//             );
//         }

//         if (pedido.status !== "PENDENTE") {
//             return NextResponse.json(
//                 {
//                     erro: "Somente pedidos pendentes podem iniciar o checkout.",
//                 },
//                 { status: 409 }
//             );
//         }

//         if (pedido.item_pedido.length === 0) {
//             return NextResponse.json(
//                 { erro: "O pedido não possui itens." },
//                 { status: 400 }
//             );
//         }

//         // 4. Conferir o total com os preços registrados nos itens.
//         let totalCentavos = 0;

//         for (const item of pedido.item_pedido) {
//             if (
//                 !Number.isSafeInteger(item.quantidade) ||
//                 item.quantidade <= 0
//             ) {
//                 return NextResponse.json(
//                     { erro: "O pedido possui uma quantidade inválida." },
//                     { status: 400 }
//                 );
//             }

//             const precoCentavos = Math.round(
//                 Number(item.preco_unitario) * 100
//             );

//             if (
//                 !Number.isSafeInteger(precoCentavos) ||
//                 precoCentavos < 0
//             ) {
//                 return NextResponse.json(
//                     { erro: "O pedido possui um preço inválido." },
//                     { status: 400 }
//                 );
//             }

//             totalCentavos += precoCentavos * item.quantidade;

//             if (!Number.isSafeInteger(totalCentavos)) {
//                 return NextResponse.json(
//                     { erro: "O total do pedido é inválido." },
//                     { status: 400 }
//                 );
//             }
//         }

//         if (
//             totalCentavos <= 0 ||
//             totalCentavos !==
//                 Math.round(Number(pedido.valor_total) * 100)
//         ) {
//             return NextResponse.json(
//                 {
//                     erro: "O total do pedido não confere com seus itens.",
//                 },
//                 { status: 409 }
//             );
//         }

//         const valorTotal = (totalCentavos / 100).toFixed(2);

//         // 5. Consultar o registro de pagamento deste pedido.
//         let pagamentoExistente = await prisma.pagamento.findUnique({
//             where: {
//                 pedido_id: pedido.id,
//             },
//         });

//         // 6. Impedir nova cobrança quando já existe pagamento aprovado.
//         if (pagamentoExistente?.status === "APROVADO") {
//             return NextResponse.json(
//                 {
//                     erro: "Este pedido já possui um pagamento aprovado.",
//                 },
//                 { status: 409 }
//             );
//         }

//         // 7. Consultar a ordem anterior antes de iniciar outra tentativa.
//         if (pagamentoExistente?.mercado_pago_order_id) {
//             let ordemAnterior;

//             try {
//                 ordemAnterior = await consultarOrderMercadoPago(
//                     pagamentoExistente.mercado_pago_order_id
//                 );
//             } catch (erroConsulta) {
//                 console.error(
//                     "Erro ao consultar ordem anterior:",
//                     erroConsulta
//                 );

//                 return NextResponse.json(
//                     {
//                         erro: "Não foi possível verificar o pagamento anterior. Tente novamente.",
//                     },
//                     { status: 502 }
//                 );
//             }

//             const statusOrdem = ordemAnterior?.status;

//             // A ordem foi processada: bloquear uma nova cobrança.
//             if (statusOrdem === "processed") {
//                 await prisma.pagamento.update({
//                     where: {
//                         id: pagamentoExistente.id,
//                     },
//                     data: {
//                         status: "APROVADO",
//                     },
//                 });

//                 return NextResponse.json(
//                     {
//                         erro: "O pagamento deste pedido já foi processado.",
//                     },
//                     { status: 409 }
//                 );
//             }

//             // A ordem foi reembolsada: exigir verificação antes de cobrar novamente.
//             if (statusOrdem === "refunded") {
//                 await prisma.pagamento.update({
//                     where: {
//                         id: pagamentoExistente.id,
//                     },
//                     data: {
//                         status: "ESTORNADO",
//                     },
//                 });

//                 return NextResponse.json(
//                     {
//                         erro: "Este pagamento foi reembolsado. É necessária uma verificação antes de cobrar novamente.",
//                     },
//                     { status: 409 }
//                 );
//             }

//             // A ordem ainda está ativa: reutilizar o checkout existente.
//             if (
//                 [
//                     "created",
//                     "processing",
//                     "action_required",
//                 ].includes(statusOrdem)
//             ) {
//                 if (pagamentoExistente.checkout_url) {
//                     return NextResponse.json(
//                         {
//                             mensagem: "Checkout já criado para este pedido.",
//                             checkout_url: pagamentoExistente.checkout_url,
//                             pedido_id: pedido.id,
//                             pagamento_id: pagamentoExistente.id,
//                         },
//                         { status: 200 }
//                     );
//                 }

//                 return NextResponse.json(
//                     {
//                         erro: "A ordem anterior ainda está ativa, mas não possui URL de checkout disponível.",
//                     },
//                     { status: 409 }
//                 );
//             }

//             // Somente ordens encerradas por falha, cancelamento ou expiração
//             // podem seguir para uma nova tentativa.
//             if (
//                 ["failed", "canceled", "expired"].includes(statusOrdem)
//             ) {
//                 pagamentoExistente = await prisma.pagamento.update({
//                     where: {
//                         id: pagamentoExistente.id,
//                     },
//                     data: {
//                         status:
//                             statusOrdem === "failed"
//                                 ? "RECUSADO"
//                                 : "CANCELADO",
//                         mercado_pago_order_id: null,
//                         checkout_url: null,
//                         idempotency_key: null,
//                     },
//                 });
//             } else {
//                 // Estado desconhecido: não arriscar uma cobrança duplicada.
//                 return NextResponse.json(
//                     {
//                         erro: "O estado da ordem anterior não é reconhecido. Verifique o pagamento antes de tentar novamente.",
//                     },
//                     { status: 409 }
//                 );
//             }
//         }

//         // 8. Criar ou reutilizar o registro local do pagamento.
//         let pagamento = pagamentoExistente;

//         if (!pagamento) {
//             pagamento = await prisma.pagamento.create({
//                 data: {
//                     pedido_id: pedido.id,
//                     provedor: "MERCADO_PAGO",
//                     status: "PENDENTE",
//                     valor: valorTotal,
//                 },
//             });
//         } else if (
//             ["RECUSADO", "CANCELADO"].includes(pagamento.status)
//         ) {
//             // Preparar uma nova tentativa após confirmar o encerramento.
//             pagamento = await prisma.pagamento.update({
//                 where: {
//                     id: pagamento.id,
//                 },
//                 data: {
//                     status: "PENDENTE",
//                     mercado_pago_order_id: null,
//                     checkout_url: null,
//                     idempotency_key: null,
//                     valor: valorTotal,
//                 },
//             });
//         } else if (pagamento.status !== "PENDENTE") {
//             return NextResponse.json(
//                 {
//                     erro: "O estado atual do pagamento não permite iniciar outra tentativa.",
//                 },
//                 { status: 409 }
//             );
//         }

//         // 9. Recuperar ou gerar a chave de idempotência.
//         // Preservar a chave existente quando a tentativa anterior
//         // ainda precisar ser recuperada.
//         let idempotencyKey = pagamento.idempotency_key;

//         if (!idempotencyKey) {
//             idempotencyKey = randomUUID();

//             pagamento = await prisma.pagamento.update({
//                 where: {
//                     id: pagamento.id,
//                 },
//                 data: {
//                     idempotency_key: idempotencyKey,
//                 },
//             });
//         }

//         // 10. Criar ou recuperar a ordem no Mercado Pago.
//         const orderMercadoPago = await criarOrderMercadoPago({
//             pedidoId: pedido.id,
//             emailCliente: cliente.email,
//             itens: pedido.item_pedido,
//             valorTotal,
//             idempotencyKey,
//         });

//         if (
//             !orderMercadoPago?.id ||
//             !orderMercadoPago?.checkout_url
//         ) {
//             console.error(
//                 "O Mercado Pago não retornou o ID e a URL do checkout."
//             );

//             return NextResponse.json(
//                 {
//                     erro: "O Mercado Pago não retornou os dados do checkout. Tente novamente.",
//                 },
//                 { status: 502 }
//             );
//         }

//         // 11. Salvar a ordem e a URL retornadas pelo Mercado Pago.
//         const pagamentoAtualizado = await prisma.pagamento.update({
//             where: {
//                 id: pagamento.id,
//             },
//             data: {
//                 mercado_pago_order_id: String(orderMercadoPago.id),
//                 checkout_url: orderMercadoPago.checkout_url,
//                 valor: valorTotal,
//             },
//         });

//         return NextResponse.json(
//             {
//                 mensagem: "Checkout criado com sucesso.",
//                 pedido_id: pedido.id,
//                 pagamento_id: pagamentoAtualizado.id,
//                 checkout_url: pagamentoAtualizado.checkout_url,
//             },
//             { status: 201 }
//         );
//     } catch (error) {
//         console.error("Erro ao iniciar checkout:", error);

//         return NextResponse.json(
//             {
//                 erro: "Não foi possível iniciar o checkout. Tente novamente.",
//             },
//             { status: 500 }
//         );
//     }
// }

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { validarSessaoCliente } from "@/lib/sessao-cliente-service";
import {
    criarOrderMercadoPago,
    consultarOrderMercadoPago,
} from "@/lib/mercado-pago-service";

export async function POST(request, { params }) {
    // 1. Validar a sessão do cliente.
    const cookieStore = await cookies();
    const token = cookieStore.get("sessao_cliente")?.value;

    if (!token) {
        return NextResponse.json(
            { erro: "Entre na sua conta para iniciar o pagamento." },
            { status: 401 }
        );
    }

    let cliente;

    try {
        cliente = await validarSessaoCliente(token);
    } catch (error) {
        console.error("Erro ao validar sessão:", error);

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
            maxAge: 0,
        });

        return resposta;
    }

    // 2. Validar o ID do pedido.
    const { id } = await params;
    const pedidoId = Number(id);

    if (!Number.isSafeInteger(pedidoId) || pedidoId <= 0) {
        return NextResponse.json(
            { erro: "ID do pedido inválido." },
            { status: 400 }
        );
    }

    try {
        // 3. Consultar o pedido pertencente ao cliente.
        const pedido = await prisma.pedido.findFirst({
            where: {
                id: pedidoId,
                cliente_id: cliente.id,
            },
            include: {
                item_pedido: {
                    include: {
                        produto: {
                            select: {
                                id: true,
                                nome: true,
                            },
                        },
                    },
                },
            },
        });

        if (!pedido) {
            return NextResponse.json(
                { erro: "Pedido não encontrado." },
                { status: 404 }
            );
        }

        if (pedido.status !== "PENDENTE") {
            return NextResponse.json(
                {
                    erro: "Somente pedidos pendentes podem iniciar o checkout.",
                },
                { status: 409 }
            );
        }

        if (pedido.item_pedido.length === 0) {
            return NextResponse.json(
                { erro: "O pedido não possui itens." },
                { status: 400 }
            );
        }

        // 4. Conferir o total dos itens em centavos.
        let totalCentavos = 0;

        for (const item of pedido.item_pedido) {
            if (
                !Number.isSafeInteger(item.quantidade) ||
                item.quantidade <= 0
            ) {
                return NextResponse.json(
                    { erro: "O pedido possui uma quantidade inválida." },
                    { status: 400 }
                );
            }

            const precoCentavos = Math.round(
                Number(item.preco_unitario) * 100
            );

            if (
                !Number.isSafeInteger(precoCentavos) ||
                precoCentavos <= 0
            ) {
                return NextResponse.json(
                    { erro: "O pedido possui um preço inválido." },
                    { status: 400 }
                );
            }

            totalCentavos += precoCentavos * item.quantidade;

            if (!Number.isSafeInteger(totalCentavos)) {
                return NextResponse.json(
                    { erro: "O total do pedido é inválido." },
                    { status: 400 }
                );
            }
        }

        if (
            totalCentavos <= 0 ||
            totalCentavos !==
                Math.round(Number(pedido.valor_total) * 100)
        ) {
            return NextResponse.json(
                {
                    erro: "O total do pedido não confere com seus itens.",
                },
                { status: 409 }
            );
        }

        const valorTotal = (totalCentavos / 100).toFixed(2);

        // 5. Buscar ou criar o pagamento principal.
        let pagamento = await prisma.pagamento.findUnique({
            where: { pedido_id: pedido.id },
        });

        if (pagamento?.status === "APROVADO") {
            return NextResponse.json(
                { erro: "Este pedido já possui um pagamento aprovado." },
                { status: 409 }
            );
        }

        if (!pagamento) {
            pagamento = await prisma.pagamento.create({
                data: {
                    pedido_id: pedido.id,
                    provedor: "MERCADO_PAGO",
                    status: "PENDENTE",
                    valor: valorTotal,
                },
            });
        }

        // 6. Buscar o histórico de tentativas.
        let tentativas = await prisma.tentativa_pagamento.findMany({
            where: { pagamento_id: pagamento.id },
            orderBy: { id: "desc" },
        });

        // 7. Compatibilidade com o pagamento anterior à nova estrutura.
        // Se a ordem ainda estiver somente na tabela pagamento,
        // consultá-la antes de iniciar uma nova tentativa.
        const ultimaTentativa = tentativas[0] ?? null;

        const ordemLegadaPrecisaMigrar =
            !ultimaTentativa &&
            Boolean(pagamento.mercado_pago_order_id);

        if (ordemLegadaPrecisaMigrar) {
            let ordemLegada;

            try {
                ordemLegada = await consultarOrderMercadoPago(
                    pagamento.mercado_pago_order_id
                );
            } catch (error) {
                console.error("Erro ao consultar ordem legada:", error);

                return NextResponse.json(
                    {
                        erro: "Não foi possível verificar o pagamento anterior.",
                    },
                    { status: 502 }
                );
            }

            const statusLegado = ordemLegada?.status;

            if (
                ["created", "processing", "action_required"].includes(
                    statusLegado
                )
            ) {
                // Registrar a ordem já existente, sem criar outra.
                const tentativaLegada =
                    await prisma.tentativa_pagamento.create({
                        data: {
                            pagamento_id: pagamento.id,
                            mercado_pago_order_id:
                                pagamento.mercado_pago_order_id,
                            checkout_url: pagamento.checkout_url,
                            idempotency_key:
                                pagamento.idempotency_key,
                            status: "PENDENTE",
                            valor: valorTotal,
                        },
                    });

                return NextResponse.json(
                    {
                        mensagem: "Checkout existente recuperado.",
                        pedido_id: pedido.id,
                        pagamento_id: pagamento.id,
                        tentativa_pagamento_id: tentativaLegada.id,
                        checkout_url: tentativaLegada.checkout_url,
                    },
                    { status: 200 }
                );
            }

            if (statusLegado === "processed") {
                await prisma.pagamento.update({
                    where: { id: pagamento.id },
                    data: { status: "APROVADO" },
                });

                return NextResponse.json(
                    {
                        erro: "O pagamento foi processado. Verifique o estado do pedido.",
                    },
                    { status: 409 }
                );
            }

            if (statusLegado === "refunded") {
                await prisma.pagamento.update({
                    where: { id: pagamento.id },
                    data: { status: "ESTORNADO" },
                });

                return NextResponse.json(
                    {
                        erro: "A ordem foi reembolsada. É necessária uma verificação manual.",
                    },
                    { status: 409 }
                );
            }

            if (
                !["failed", "canceled", "expired"].includes(statusLegado)
            ) {
                return NextResponse.json(
                    {
                        erro: "Não foi possível confirmar o encerramento da ordem anterior.",
                    },
                    { status: 409 }
                );
            }

            const statusFinalLegado =
                statusLegado === "failed" ? "RECUSADO" : "CANCELADO";

            // Preservar a tentativa anterior no histórico.
            await prisma.tentativa_pagamento.create({
                data: {
                    pagamento_id: pagamento.id,
                    mercado_pago_order_id:
                        pagamento.mercado_pago_order_id,
                    checkout_url: pagamento.checkout_url,
                    idempotency_key: pagamento.idempotency_key,
                    status: statusFinalLegado,
                    valor: pagamento.valor,
                },
            });

            // Liberar os campos antigos do pagamento principal.
            pagamento = await prisma.pagamento.update({
                where: { id: pagamento.id },
                data: {
                    status: statusFinalLegado,
                    mercado_pago_order_id: null,
                    checkout_url: null,
                    idempotency_key: null,
                },
            });

            tentativas = await prisma.tentativa_pagamento.findMany({
                where: { pagamento_id: pagamento.id },
                orderBy: { id: "desc" },
            });
        }

        // 8. Verificar a última tentativa registrada.
        let tentativaAtual = tentativas[0] ?? null;

        if (tentativaAtual?.mercado_pago_order_id) {
            let ordemAnterior;

            try {
                ordemAnterior = await consultarOrderMercadoPago(
                    tentativaAtual.mercado_pago_order_id
                );
            } catch (error) {
                console.error("Erro ao consultar tentativa anterior:", error);

                return NextResponse.json(
                    {
                        erro: "Não foi possível verificar a tentativa anterior. Tente novamente.",
                    },
                    { status: 502 }
                );
            }

            const statusOrdem = ordemAnterior?.status;

            if (
                ["created", "processing", "action_required"].includes(
                    statusOrdem
                )
            ) {
                if (tentativaAtual.checkout_url) {
                    return NextResponse.json(
                        {
                            mensagem: "Checkout já criado para este pedido.",
                            pedido_id: pedido.id,
                            pagamento_id: pagamento.id,
                            tentativa_pagamento_id: tentativaAtual.id,
                            checkout_url: tentativaAtual.checkout_url,
                        },
                        { status: 200 }
                    );
                }

                return NextResponse.json(
                    {
                        erro: "A ordem continua ativa, mas não possui checkout disponível.",
                    },
                    { status: 409 }
                );
            }

            if (statusOrdem === "processed") {
                await prisma.$transaction(async (tx) => {
                    await tx.tentativa_pagamento.update({
                        where: { id: tentativaAtual.id },
                        data: { status: "APROVADO" },
                    });

                    await tx.pagamento.update({
                        where: { id: pagamento.id },
                        data: { status: "APROVADO" },
                    });
                });

                return NextResponse.json(
                    { erro: "O pagamento já foi processado." },
                    { status: 409 }
                );
            }

            if (statusOrdem === "refunded") {
                await prisma.$transaction(async (tx) => {
                    await tx.tentativa_pagamento.update({
                        where: { id: tentativaAtual.id },
                        data: { status: "ESTORNADO" },
                    });

                    await tx.pagamento.update({
                        where: { id: pagamento.id },
                        data: { status: "ESTORNADO" },
                    });
                });

                return NextResponse.json(
                    {
                        erro: "O pagamento foi reembolsado. É necessária uma verificação manual.",
                    },
                    { status: 409 }
                );
            }

            if (
                !["failed", "canceled", "expired"].includes(statusOrdem)
            ) {
                return NextResponse.json(
                    {
                        erro: "Estado da ordem desconhecido. Não será criada outra cobrança.",
                    },
                    { status: 409 }
                );
            }

            // 9. Encerrar a tentativa anterior sem apagá-la.
            const statusFinal =
                statusOrdem === "failed" ? "RECUSADO" : "CANCELADO";

            await prisma.$transaction(async (tx) => {
                await tx.tentativa_pagamento.update({
                    where: { id: tentativaAtual.id },
                    data: { status: statusFinal },
                });

                await tx.pagamento.update({
                    where: { id: pagamento.id },
                    data: {
                        status: statusFinal,
                        mercado_pago_order_id: null,
                        checkout_url: null,
                        idempotency_key: null,
                    },
                });
            });

            pagamento = await prisma.pagamento.findUnique({
                where: { id: pagamento.id },
            });

            tentativaAtual = null;
        }

        // 10. Se existe uma tentativa sem ordem vinculada,
        // reutilizar sua chave para recuperar uma chamada anterior.
        if (
            tentativaAtual &&
            !tentativaAtual.mercado_pago_order_id &&
            tentativaAtual.status === "PENDENTE"
        ) {
            // A chave permanece a mesma para idempotência.
        } else {
            // Uma nova tentativa recebe uma nova chave.
            tentativaAtual = await prisma.tentativa_pagamento.create({
                data: {
                    pagamento_id: pagamento.id,
                    status: "PENDENTE",
                    valor: valorTotal,
                    idempotency_key: randomUUID(),
                },
            });
        }

        // 11. Sincronizar o estado principal sem apagar o histórico.
        await prisma.pagamento.update({
            where: { id: pagamento.id },
            data: {
                status: "PENDENTE",
                valor: valorTotal,
                mercado_pago_order_id: null,
                checkout_url: null,
                idempotency_key: tentativaAtual.idempotency_key,
            },
        });

        // 12. Criar ou recuperar a ordem no Mercado Pago.
        const orderMercadoPago = await criarOrderMercadoPago({
            pedidoId: pedido.id,
            emailCliente: cliente.email,
            itens: pedido.item_pedido,
            valorTotal,
            idempotencyKey: tentativaAtual.idempotency_key,
        });

        if (!orderMercadoPago?.id || !orderMercadoPago?.checkout_url) {
            console.error(
                "O Mercado Pago não retornou o ID e a URL do checkout."
            );

            return NextResponse.json(
                {
                    erro: "O Mercado Pago não retornou os dados do checkout. Tente novamente.",
                },
                { status: 502 }
            );
        }

        // 13. Salvar a ordem na tentativa e no pagamento principal.
        const ordemId = String(orderMercadoPago.id);

        const resultado = await prisma.$transaction(async (tx) => {
            const tentativa = await tx.tentativa_pagamento.update({
                where: { id: tentativaAtual.id },
                data: {
                    mercado_pago_order_id: ordemId,
                    checkout_url: orderMercadoPago.checkout_url,
                    status: "PENDENTE",
                    valor: valorTotal,
                },
            });

            const pagamentoAtualizado = await tx.pagamento.update({
                where: { id: pagamento.id },
                data: {
                    mercado_pago_order_id: ordemId,
                    checkout_url: orderMercadoPago.checkout_url,
                    idempotency_key: tentativaAtual.idempotency_key,
                    status: "PENDENTE",
                    valor: valorTotal,
                },
            });

            return { tentativa, pagamentoAtualizado };
        });

        return NextResponse.json(
            {
                mensagem: "Checkout criado com sucesso.",
                pedido_id: pedido.id,
                pagamento_id: resultado.pagamentoAtualizado.id,
                tentativa_pagamento_id: resultado.tentativa.id,
                checkout_url: resultado.tentativa.checkout_url,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Erro ao iniciar checkout:", error);

        return NextResponse.json(
            {
                erro: "Não foi possível iniciar o checkout. Tente novamente.",
            },
            { status: 500 }
        );
    }
}