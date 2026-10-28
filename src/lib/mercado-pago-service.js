
import { MercadoPagoConfig, Order } from "mercadopago";

function obterServicoOrder() {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!accessToken) {
        throw new Error(
            "A variável MERCADO_PAGO_ACCESS_TOKEN não está configurada."
        );
    }

    const clienteMercadoPago = new MercadoPagoConfig({
        accessToken,
        options: {
            timeout: 10000,
        },
    });

    return new Order(clienteMercadoPago);
}



export async function consultarOrderMercadoPago(orderId) {
    if (!orderId) {
        throw new Error("O ID da ordem é obrigatório.");
    }

    const order = obterServicoOrder();

    try {
        return await order.get({
            id: String(orderId),
        });
    } catch (erro) {
        console.error("Erro ao consultar ordem no Mercado Pago:", {
            nome: erro?.name,
            mensagem: erro?.message,
            status: erro?.status,
            codigo: erro?.code,
            erro: erro?.error,
            causas: erro?.causes,
            mensagemInterna: erro?.cause?.message,
        });

        throw erro;
    }
}



export async function criarOrderMercadoPago({
    pedidoId,
    emailCliente,
    itens,
    valorTotal,
    idempotencyKey,
}) {
    if (!idempotencyKey) {
        throw new Error("A chave de idempotência é obrigatória.");
    }

    const order = obterServicoOrder();

    const urlBase = process.env.APP_URL?.replace(/\/$/, "");

    if (!urlBase) {
        throw new Error("A variável APP_URL não está configurada.");
    }
    const corpo = {
    
    type: "online",
    processing_mode: "manual",
    total_amount: valorTotal,
    external_reference: String(pedidoId),

    payer: {
        email: emailCliente,
    },

    items: itens.map((item) => ({
        title: item.produto.nome,
        quantity: item.quantidade,
        unit_price: Number(item.preco_unitario).toFixed(2),
    })),
        config: {
        online: {
            success_url: `${urlBase}/pedido/resultado?pedido=${pedidoId}&resultado=aprovado`,
            failure_url: `${urlBase}/pedido/resultado?pedido=${pedidoId}&resultado=recusado`,
            pending_url: `${urlBase}/pedido/resultado?pedido=${pedidoId}&resultado=pendente`,
            auto_return: "all",
        },
},
};

    console.log("Diagnóstico do comprador:", {
    emailRecebido: Boolean(emailCliente),
    formatoValido: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    emailCliente ?? ""
),
});
    console.log(
    "Dados enviados ao Mercado Pago:",
    JSON.stringify(
        {
            ...corpo,
            payer: {
                email: corpo.payer.email ? "[e-mail informado]" : "[ausente]",
            },
        },
        null,
        2
    )
);
    try {
    return await order.create({
        body: corpo,
        requestOptions: { idempotencyKey },
    });

    
} catch (erro) {
    console.error("Erro completo do Mercado Pago:");
    console.dir(erro, { depth: 8 });

    console.error("Propriedades disponíveis no erro:", {
        name: erro?.name,
        message: erro?.message,
        status: erro?.status,
        error: erro?.error,
        causes: erro?.causes,
        cause: erro?.cause,
        keys: Object.keys(erro ?? {}),
        propriedades: Object.getOwnPropertyNames(erro ?? {}),
    });

    if (erro?.cause) {
        console.error("Causa interna do erro:");
        console.dir(erro.cause, { depth: 8 });
    }

    throw erro;
}


}
