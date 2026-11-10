
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const nomesStatusPedido = {
  PENDENTE: "Pendente",
  CONFIRMADO: "Confirmado",
  ENVIADO: "Enviado",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

const nomesStatusPagamento = {
  PENDENTE: "Pendente",
  EM_PROCESSAMENTO: "Em processamento",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
  CANCELADO: "Cancelado",
  ESTORNADO: "Estornado",
  EM_DISPUTA: "Em disputa",
};

function formatarData(data) {
  if (!data) return "Não informado";
  return new Date(data).toLocaleString("pt-BR");
}

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function classeStatusPedido(status) {
  const classes = {
    PENDENTE: "bg-yellow-100 text-yellow-700",
    CONFIRMADO: "bg-blue-100 text-blue-700",
    ENVIADO: "bg-purple-100 text-purple-700",
    ENTREGUE: "bg-green-100 text-green-700",
    CANCELADO: "bg-red-100 text-red-700",
  };

  return classes[status] || "bg-gray-100 text-gray-700";
}

function classeStatusPagamento(status) {
  const classes = {
    PENDENTE: "bg-yellow-100 text-yellow-700",
    EM_PROCESSAMENTO: "bg-blue-100 text-blue-700",
    APROVADO: "bg-green-100 text-green-700",
    RECUSADO: "bg-red-100 text-red-700",
    CANCELADO: "bg-gray-100 text-gray-700",
    ESTORNADO: "bg-orange-100 text-orange-700",
    EM_DISPUTA: "bg-purple-100 text-purple-700",
  };

  return classes[status] || "bg-gray-100 text-gray-700";
}

export default function AdminPedidoDetalhesPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [pedido, setPedido] = useState(null);
  const [proximosStatus, setProximosStatus] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    const controlador = new AbortController();

    async function carregarPedido() {
      try {
        const resposta = await fetch(`/api/admin/pedidos/${id}`, {
          cache: "no-store",
          signal: controlador.signal,
        });

        if (resposta.status === 401) {
          router.replace("/admin/login");
          return;
        }

        const dados = await resposta.json();

        if (!resposta.ok) {
          setErro(dados.mensagem || "Não foi possível carregar o pedido.");
          return;
        }

        setPedido(dados.pedido);
        setProximosStatus(dados.proximosStatus || []);
        setErro("");
      } catch (erro) {
        if (erro.name !== "AbortError") {
          console.error("Erro ao carregar pedido:", erro);
          setErro("Não foi possível conectar ao servidor.");
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCarregando(false);
        }
      }
    }

    carregarPedido();

    return () => controlador.abort();
  }, [id, router]);

  async function atualizarStatus(novoStatus) {
    const nomeStatus = nomesStatusPedido[novoStatus] || novoStatus;

    const confirmado = window.confirm(
      `Deseja realmente alterar o status do pedido #${id} para ${nomeStatus}?`
    );

    if (!confirmado) return;

    setAtualizando(true);
    setErro("");
    setSucesso("");

    try {
      const resposta = await fetch(`/api/admin/pedidos/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: novoStatus,
        }),
      });

      if (resposta.status === 401) {
        router.replace("/admin/login");
        return;
      }

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.mensagem || "Não foi possível atualizar o pedido.");
        return;
      }

      setPedido((atual) => ({
        ...atual,
        status: dados.pedido.status,
      }));

      setProximosStatus(dados.proximosStatus || []);

      setSucesso(dados.mensagem);
    } catch (erro) {
      console.error("Erro ao atualizar status:", erro);
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setAtualizando(false);
    }
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-600">Carregando detalhes do pedido...</p>
      </main>
    );
  }

  if (erro && !pedido) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-sm">
          <p role="alert" className="text-red-700">
            {erro}
          </p>

          <button
            onClick={() => router.push("/admin/pedidos")}
            className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Voltar aos pedidos
          </button>
        </div>
      </main>
    );
  }

  if (!pedido) return null;

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Pedido #{pedido.id}
          </h1>

          <p className="text-sm text-gray-500">
            Produções da Vick Crochê
          </p>
        </div>

        <button
          onClick={() => router.push("/admin/pedidos")}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Voltar aos pedidos
        </button>
      </header>

      <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {erro && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
          >
            {erro}
          </div>
        )}

        {sucesso && (
          <div
            role="status"
            className="rounded-lg bg-green-50 p-4 text-sm text-green-700"
          >
            {sucesso}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-800">
              Informações do pedido
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500">Número do pedido</p>
                <p className="font-semibold text-gray-800">
                  #{pedido.id}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Data da compra</p>
                <p className="font-medium text-gray-800">
                  {formatarData(pedido.data_pedido)}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Valor total</p>
                <p className="text-xl font-bold text-gray-800">
                  {formatarMoeda(pedido.valor_total)}
                </p>
              </div>

              <div>
                <p className="text-gray-500">E-mail de confirmação</p>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                    pedido.email_confirmacao_enviado
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {pedido.email_confirmacao_enviado
                    ? "Enviado"
                    : "Não enviado"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-800">
              Dados do cliente
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500">Nome</p>
                <p className="font-medium text-gray-800">
                  {pedido.cliente.nome}
                </p>
              </div>

              <div>
                <p className="text-gray-500">E-mail</p>
                <p className="font-medium text-gray-800">
                  {pedido.cliente.email}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Telefone</p>
                <p className="font-medium text-gray-800">
                  {pedido.cliente.telefone || "Não informado"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-800">
            Status do pedido
          </h2>

          <div className="mb-5">
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${classeStatusPedido(pedido.status)}`}
            >
              {nomesStatusPedido[pedido.status] || pedido.status}
            </span>
          </div>

          {proximosStatus.length > 0 ? (
            <>
              <p className="mb-3 text-sm text-gray-600">
                Próximas ações disponíveis:
              </p>

              <div className="flex flex-wrap gap-3">
                {proximosStatus.map((status) => (
                  <button
                    key={status}
                    onClick={() => atualizarStatus(status)}
                    disabled={atualizando}
                    className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {atualizando
                      ? "Atualizando..."
                      : `Alterar para ${nomesStatusPedido[status] || status}`}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              Não existem novas transições disponíveis para este pedido.
            </p>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-800">
            Produtos do pedido
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Produto</th>
                  <th className="px-4 py-3 font-semibold">Quantidade</th>
                  <th className="px-4 py-3 font-semibold">Preço unitário</th>
                  <th className="px-4 py-3 font-semibold">Subtotal</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {pedido.item_pedido.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4 font-medium text-gray-800">
                      {item.produto?.nome || "Produto não encontrado"}
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {item.quantidade}
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {formatarMoeda(item.preco_unitario)}
                    </td>

                    <td className="px-4 py-4 font-medium text-gray-800">
                      {formatarMoeda(
                        Number(item.quantidade) *
                          Number(item.preco_unitario)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-800">
            Informações de pagamento
          </h2>

          {pedido.pagamento.length === 0 ? (
            <p className="text-sm text-gray-500">
              Nenhum pagamento registrado para este pedido.
            </p>
          ) : (
            <div className="space-y-6">
              {pedido.pagamento.map((pagamento) => (
                <div
                  key={pagamento.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-gray-500">
                        Status do pagamento
                      </p>

                      <span
                        className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium ${classeStatusPagamento(pagamento.status)}`}
                      >
                        {nomesStatusPagamento[pagamento.status] ||
                          pagamento.status}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Valor
                      </p>
                      <p className="font-medium text-gray-800">
                        {formatarMoeda(pagamento.valor)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Provedor
                      </p>
                      <p className="font-medium text-gray-800">
                        {pagamento.provedor || "Não informado"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Data de criação
                      </p>
                      <p className="font-medium text-gray-800">
                        {formatarData(pagamento.criado_em)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <h3 className="mb-3 font-semibold text-gray-800">
                      Tentativas de pagamento
                    </h3>

                    {pagamento.tentativas.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        Nenhuma tentativa registrada.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {pagamento.tentativas.map((tentativa) => (
                          <div
                            key={tentativa.id}
                            className="rounded-lg bg-gray-50 p-4 text-sm"
                          >
                            <p className="font-medium text-gray-800">
                              Status: {nomesStatusPagamento[tentativa.status] || tentativa.status}
                            </p>

                            <p className="mt-1 text-gray-600">
                              Valor: {formatarMoeda(tentativa.valor)}
                            </p>

                            <p className="mt-1 text-gray-600">
                              Criada em: {formatarData(tentativa.criado_em)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
