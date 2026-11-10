
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const statusPedido = {
  PENDENTE: "Pendente",
  CONFIRMADO: "Confirmado",
  ENVIADO: "Enviado",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

const statusPagamento = {
  PENDENTE: "Pendente",
  EM_PROCESSAMENTO: "Em processamento",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
  CANCELADO: "Cancelado",
  ESTORNADO: "Estornado",
  EM_DISPUTA: "Em disputa",
};

function formatarData(data) {
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

export default function AdminPedidosPage() {
  const router = useRouter();

  const [pedidos, setPedidos] = useState([]);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [statusPagamentoFiltro, setStatusPagamentoFiltro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [atualizacao, setAtualizacao] = useState(0);

  const limite = 10;

  useEffect(() => {
    const controlador = new AbortController();

    async function carregarPedidos() {
      try {
        const parametros = new URLSearchParams({
          busca,
          pagina: String(pagina),
          limite: String(limite),
        });

        if (status) {
          parametros.set("status", status);
        }

        if (statusPagamentoFiltro) {
          parametros.set("statusPagamento", statusPagamentoFiltro);
        }

        const resposta = await fetch(
          `/api/admin/pedidos?${parametros.toString()}`,
          {
            cache: "no-store",
            signal: controlador.signal,
          }
        );

        if (resposta.status === 401) {
          router.replace("/admin/login");
          return;
        }

        const dados = await resposta.json();

        if (!resposta.ok) {
          setErro(dados.mensagem || "Não foi possível carregar os pedidos.");
          return;
        }

        setPedidos(dados.pedidos);
        setTotal(dados.total);
        setTotalPaginas(dados.totalPaginas);
        setErro("");
      } catch (erro) {
        if (erro.name !== "AbortError") {
          console.error("Erro ao carregar pedidos:", erro);
          setErro("Não foi possível conectar ao servidor.");
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCarregando(false);
        }
      }
    }

    carregarPedidos();

    return () => controlador.abort();
  }, [
    busca,
    status,
    statusPagamentoFiltro,
    pagina,
    atualizacao,
    router,
  ]);

  function tentarNovamente() {
    setErro("");
    setCarregando(true);
    setAtualizacao((atual) => atual + 1);
  }

  function alterarBusca(valor) {
    setCarregando(true);
    setBusca(valor);
    setPagina(1);
  }

  function alterarStatus(valor) {
    setCarregando(true);
    setStatus(valor);
    setPagina(1);
  }

  function alterarStatusPagamento(valor) {
    setCarregando(true);
    setStatusPagamentoFiltro(valor);
    setPagina(1);
  }

  function abrirPedido(id) {
    router.push(`/admin/pedidos/${id}`);
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Gerenciamento de Pedidos
          </h1>
          <p className="text-sm text-gray-500">
            Produções da Vick Crochê
          </p>
        </div>

        <button
          onClick={() => router.push("/admin")}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Voltar ao painel
        </button>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 grid gap-4 rounded-xl bg-white p-5 shadow-sm md:grid-cols-3">
          <div>
            <label
              htmlFor="busca"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Pesquisar pedido
            </label>

            <input
              id="busca"
              type="search"
              value={busca}
              onChange={(event) => alterarBusca(event.target.value)}
              placeholder="ID, nome ou e-mail do cliente..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 outline-none focus:border-gray-800"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Status do pedido
            </label>

            <select
              id="status"
              value={status}
              onChange={(event) => alterarStatus(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:border-gray-800"
            >
              <option value="">Todos os status</option>
              {Object.entries(statusPedido).map(([valor, nome]) => (
                <option key={valor} value={valor}>
                  {nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="statusPagamento"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Status do pagamento
            </label>

            <select
              id="statusPagamento"
              value={statusPagamentoFiltro}
              onChange={(event) =>
                alterarStatusPagamento(event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:border-gray-800"
            >
              <option value="">Todos os pagamentos</option>
              {Object.entries(statusPagamento).map(([valor, nome]) => (
                <option key={valor} value={valor}>
                  {nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4 rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total de pedidos encontrados
          </p>
          <p className="mt-1 text-3xl font-bold text-gray-800">{total}</p>
        </div>

        {erro && (
          <div
            role="alert"
            className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700"
          >
            {erro}
            <button
              onClick={tentarNovamente}
              className="ml-3 font-semibold underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-4 font-semibold">Pedido</th>
                  <th className="px-5 py-4 font-semibold">Cliente</th>
                  <th className="px-5 py-4 font-semibold">Data</th>
                  <th className="px-5 py-4 font-semibold">Valor total</th>
                  <th className="px-5 py-4 font-semibold">Status do pedido</th>
                  <th className="px-5 py-4 font-semibold">Pagamento</th>
                  <th className="px-5 py-4 font-semibold">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {carregando ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-10 text-center text-gray-500">
                      Carregando pedidos...
                    </td>
                  </tr>
                ) : pedidos.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-10 text-center text-gray-500">
                      Nenhum pedido encontrado.
                    </td>
                  </tr>
                ) : (
                  pedidos.map((pedido) => (
                    <tr key={pedido.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-semibold text-gray-800">
                        #{pedido.id}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800">
                          {pedido.cliente.nome}
                        </p>
                        <p className="text-gray-500">
                          {pedido.cliente.email}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatarData(pedido.data_pedido)}
                      </td>

                      <td className="px-5 py-4 font-medium text-gray-800">
                        {formatarMoeda(pedido.valor_total)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${classeStatusPedido(pedido.status)}`}
                        >
                          {statusPedido[pedido.status] || pedido.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {pedido.pagamento.length > 0 ? (
                          pedido.pagamento.map((pagamento) => (
                            <span
                              key={pagamento.id}
                              className={`mb-1 inline-block rounded-full px-3 py-1 text-xs font-medium ${classeStatusPagamento(pagamento.status)}`}
                            >
                              {statusPagamento[pagamento.status] ||
                                pagamento.status}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">
                            Não informado
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() => abrirPedido(pedido.id)}
                          className="rounded-lg bg-gray-800 px-4 py-2 text-xs font-medium text-white hover:bg-gray-700"
                        >
                          Ver detalhes
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 px-5 py-4">
            <p className="text-sm text-gray-500">
              Página {pagina} de {Math.max(totalPaginas, 1)}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCarregando(true);
                  setPagina((atual) => atual - 1);
                }}
                disabled={pagina <= 1 || carregando}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>

              <button
                onClick={() => {
                  setCarregando(true);
                  setPagina((atual) => atual + 1);
                }}
                disabled={pagina >= totalPaginas || carregando}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
