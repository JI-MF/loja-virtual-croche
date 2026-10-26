const transicoesPermitidas = {
    PENDENTE : ["CONFIRMADO", "CANCELADO"],
    CONFIRMADO : ["ENVIADO"],
    ENVIADO : ["ENTREGUE"],
    ENTRGUE : [],
    CANCELADO : []
};

export function podeAlterarStatus(statusAtual, novoStatus){
    const proximoStatus = transicoesPermitidas[statusAtual];

    if (!proximoStatus){
        return false;
    }

    return proximoStatus.includes(novoStatus);
}

export function obterProximosStatus(statusAtual){
    return transicoesPermitidas[statusAtual]??[];
}