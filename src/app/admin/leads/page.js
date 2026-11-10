
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLeadsPage() {
  const router = useRouter();

  const [leads, setLeads] = useState([]);
  const [busca, setBusca] = useState("");
  const [verificado, setVerificado] = useState("");
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const limite = 10;

    
const [atualizacao, setAtualizacao] = useState(0);

useEffect(() => {
const controlador = new AbortController();

async function carregarLeads() {
    try {
    const parametros = new URLSearchParams({
        busca,
        pagina: String(pagina),
        limite: String(limite),
    });

    if (verificado !== "") {
        parametros.set("verificado", verificado);
    }

    const resposta = await fetch(
        `/api/admin/leads?${parametros.toString()}`,
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
        setErro(dados.mensagem || "Não foi possível carregar os leads.");
        return;
    }

    setLeads(dados.leads);
    setTotal(dados.total);
    setTotalPaginas(dados.totalPaginas);
    setErro("");
    } catch (erro) {
    if (erro.name !== "AbortError") {
        console.error("Erro ao carregar leads:", erro);
        setErro("Não foi possível conectar ao servidor.");
    }
    } finally {
    if (!controlador.signal.aborted) {
        setCarregando(false);
    }
    }
}

    carregarLeads();

    return () => controlador.abort();
    }, [busca, pagina, verificado, atualizacao, router]);

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

  function alterarFiltro(valor) {
    setCarregando(true);
    setVerificado(valor);
    setPagina(1);
  }

  function formatarData(data) {
    return new Date(data).toLocaleString("pt-BR");
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Gerenciamento de Leads
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
        <div className="mb-6 grid gap-4 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-2">
          <div>
            <label
              htmlFor="busca"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Pesquisar lead
            </label>

            <input
              id="busca"
              type="search"
              value={busca}
              onChange={(event) => alterarBusca(event.target.value)}
              placeholder="Digite um nome ou e-mail..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 outline-none focus:border-gray-800"
            />
          </div>

          <div>
            <label
              htmlFor="verificado"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Verificação do e-mail
            </label>

            <select
              id="verificado"
              value={verificado}
              onChange={(event) => alterarFiltro(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:border-gray-800"
            >
              <option value="">Todos os leads</option>
              <option value="true">E-mail verificado</option>
              <option value="false">E-mail não verificado</option>
            </select>
          </div>
        </div>

        <div className="mb-4 rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total de leads encontrados</p>
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
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-4 font-semibold">Nome</th>
                  <th className="px-5 py-4 font-semibold">E-mail</th>
                  <th className="px-5 py-4 font-semibold">Telefone</th>
                  <th className="px-5 py-4 font-semibold">Produto</th>
                  <th className="px-5 py-4 font-semibold">Cadastro</th>
                  <th className="px-5 py-4 font-semibold">Verificação</th>
                  <th className="px-5 py-4 font-semibold">Mensagem</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {carregando ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-10 text-center text-gray-500">
                      Carregando leads...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-10 text-center text-gray-500">
                      Nenhum lead encontrado.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-medium text-gray-800">
                        {lead.nome}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {lead.email}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {lead.telefone || "Não informado"}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {lead.produto?.nome || "Não informado"}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatarData(lead.criado_em)}
                      </td>

                      <td className="px-5 py-4">
                        {lead.email_verificado ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                            Verificado
                          </span>
                        ) : (
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                            Pendente
                          </span>
                        )}
                      </td>

                      <td className="max-w-xs px-5 py-4 text-gray-600">
                        <span title={lead.mensagem}>
                          {lead.mensagem}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 px-5 py-4">
            <p className="text-sm text-gray-500">
              Página {pagina} de {totalPaginas}
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
