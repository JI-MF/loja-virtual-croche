
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

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
  const [atualizacao, setAtualizacao] = useState(0);

  const limite = 10;

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
    if (!data) return "Não informado";

    return new Date(data).toLocaleString("pt-BR");
  }

  return (
    <main className="min-h-screen bg-[#faf6f7] text-[#393236] lg:flex">

      {/* MENU LATERAL */}
      <aside className="flex w-full flex-col border-b border-[#eee3e8] bg-white lg:min-h-screen lg:w-72 lg:border-r lg:border-b-0">

        <div className="flex items-center justify-between px-6 py-5 lg:justify-center lg:py-8">
          <Link href="/admin" aria-label="Início administrativo">
            <Image
              src="/images/Logo - Produções da Vick croche.svg"
              alt="Produções da Vick Crochê"
              width={155}
              height={75}
              priority
              className="h-auto w-36 object-contain"
            />
          </Link>

          <span className="rounded-full bg-[#f7edf1] px-3 py-1 text-xs font-medium text-[#a36583] lg:hidden">
            Administração
          </span>
        </div>

        <div className="hidden px-6 pb-3 lg:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#b58a9e]">
            Menu principal
          </p>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:flex-col lg:px-5">
          <Link
            href="/admin"
            className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#665961] transition hover:bg-[#faf3f6] hover:text-[#a36583]"
          >
            <span className="text-lg">⌂</span>
            Início
          </Link>

          <Link
            href="/admin/leads"
            className="flex shrink-0 items-center gap-3 rounded-xl bg-[#f7edf1] px-4 py-3 text-sm font-semibold text-[#a36583]"
          >
            <span className="text-lg">♡</span>
            Leads cadastrados
          </Link>

          <Link
            href="/admin/pedidos"
            className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#665961] transition hover:bg-[#faf3f6] hover:text-[#a36583]"
          >
            <span className="text-lg">▤</span>
            Pedidos
          </Link>
        </nav>

        <div className="mt-auto hidden border-t border-[#f0e7eb] p-6 lg:block">
          <p className="text-xs leading-relaxed text-[#9b8c94]">
            Produções da Vick Crochê
          </p>
          <p className="mt-1 text-[10px] text-[#b4a5ac]">
            Painel de gerenciamento
          </p>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="min-w-0 flex-1">

        {/* CABEÇALHO */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eee3e8] bg-white px-6 py-5 sm:px-10">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#b58a9e]">
              Gerenciamento
            </p>
            <h1 className="mt-1 font-serif text-xl text-[#393236]">
              Leads cadastrados
            </h1>
          </div>

          <Link
            href="/admin"
            className="rounded-lg border border-[#e8d8df] px-4 py-2.5 text-sm font-medium text-[#9b607c] transition hover:bg-[#faf1f5]"
          >
            ← Voltar ao painel
          </Link>
        </header>

        {/* ÁREA DE CONTEÚDO */}
        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-10 sm:py-10">

          {/* INTRODUÇÃO */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b58a9e]">
              Relacionamento com clientes
            </p>

            <h2 className="mt-2 font-serif text-3xl text-[#42343c]">
              Gerencie seus leads
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#897982]">
              Consulte os contatos registrados na loja, pesquise
              informações e acompanhe a situação de verificação dos e-mails.
            </p>
          </div>

          {/* TOTAL DE LEADS */}
          <div className="mb-7 grid gap-5 sm:grid-cols-2">

            <div className="flex items-center gap-5 rounded-2xl border border-[#eee2e8] bg-white p-6 shadow-sm">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f8edf2] text-2xl text-[#ad718e]">
                ♡
              </div>

              <div>
                <p className="text-sm text-[#897982]">
                  Total de leads encontrados
                </p>

                <p className="mt-1 text-3xl font-semibold tabular-nums text-[#493b43]">
                  {total}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5 rounded-2xl border border-[#eee2e8] bg-white p-6 shadow-sm">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f8edf2] text-2xl text-[#ad718e]">
                <span>✉</span>
              </div>

              <div>
                <p className="text-sm text-[#897982]">
                  Registros por página
                </p>

                <p className="mt-1 text-3xl font-semibold tabular-nums text-[#493b43]">
                  {limite}
                </p>
              </div>
            </div>
          </div>

          {/* PESQUISA E FILTROS */}
          <div className="mb-7 rounded-2xl border border-[#eee2e8] bg-white p-6 shadow-sm sm:p-7">

            <div className="mb-5">
              <h3 className="font-serif text-xl text-[#493b43]">
                Pesquisa e filtros
              </h3>

              <p className="mt-1 text-sm text-[#9b8c94]">
                Localize os contatos de acordo com as informações disponíveis.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label
                  htmlFor="busca"
                  className="mb-2 block text-sm font-semibold text-[#554650]"
                >
                  Pesquisar lead
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#b58a9e]">
                    ⌕
                  </span>

                  <input
                    id="busca"
                    type="search"
                    value={busca}
                    onChange={(event) => alterarBusca(event.target.value)}
                    placeholder="Digite um nome ou e-mail..."
                    className="w-full rounded-xl border border-[#e8d8df] bg-white py-3.5 pl-11 pr-4 text-sm text-[#493b43] outline-none transition placeholder:text-[#b5a5ad] hover:border-[#d6b5c4] focus:border-[#ad718e] focus:ring-4 focus:ring-[#ad718e]/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="verificado"
                  className="mb-2 block text-sm font-semibold text-[#554650]"
                >
                  Verificação do e-mail
                </label>

                <select
                  id="verificado"
                  value={verificado}
                  onChange={(event) => alterarFiltro(event.target.value)}
                  className="w-full rounded-xl border border-[#e8d8df] bg-white px-4 py-3.5 text-sm text-[#493b43] outline-none transition hover:border-[#d6b5c4] focus:border-[#ad718e] focus:ring-4 focus:ring-[#ad718e]/10"
                >
                  <option value="">Todos os leads</option>
                  <option value="true">E-mail verificado</option>
                  <option value="false">E-mail não verificado</option>
                </select>
              </div>

            </div>
          </div>

          {/* MENSAGEM DE ERRO */}
          {erro && (
            <div
              role="alert"
              className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            >
              <span>{erro}</span>

              <button
                onClick={tentarNovamente}
                className="font-semibold underline underline-offset-4"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* TABELA */}
          <div className="overflow-hidden rounded-2xl border border-[#eee2e8] bg-white shadow-sm">

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1e9ed] px-6 py-5">
              <div>
                <h3 className="font-serif text-xl text-[#493b43]">
                  Lista de leads
                </h3>

                <p className="mt-1 text-xs text-[#9b8c94]">
                  Informações dos contatos cadastrados.
                </p>
              </div>

              <span className="rounded-full bg-[#f8edf2] px-3 py-1.5 text-xs font-semibold text-[#a36583]">
                {total} registro(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">

                <thead className="bg-[#fcf8fa] text-[#806c77]">
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

                <tbody className="divide-y divide-[#f3ebef]">

                  {carregando ? (
                    <tr>
                      <td colSpan="7" className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#ead8e0] border-t-[#ad718e]" />

                          <span className="text-sm text-[#897982]">
                            Carregando leads...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : leads.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-5 py-16 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8edf2] text-2xl text-[#ad718e]">
                            ♡
                          </div>

                          <p className="mt-4 font-serif text-lg text-[#493b43]">
                            Nenhum lead encontrado
                          </p>

                          <p className="mt-2 text-sm leading-6 text-[#9b8c94]">
                            Não existem registros correspondentes
                            aos critérios da pesquisa.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="transition hover:bg-[#fdf9fb]"
                      >
                        <td className="px-5 py-4 font-semibold text-[#493b43]">
                          {lead.nome}
                        </td>

                        <td className="px-5 py-4 text-[#786873]">
                          {lead.email}
                        </td>

                        <td className="px-5 py-4 text-[#786873]">
                          {lead.telefone || "Não informado"}
                        </td>

                        <td className="px-5 py-4 text-[#786873]">
                          {lead.produto?.nome || "Não informado"}
                        </td>

                        <td className="px-5 py-4 text-[#786873]">
                          {formatarData(lead.criado_em)}
                        </td>

                        <td className="px-5 py-4">
                          {lead.email_verificado ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf6ef] px-3 py-1.5 text-xs font-semibold text-[#487653]">
                              <span>✓</span>
                              Verificado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fbf3e5] px-3 py-1.5 text-xs font-semibold text-[#a27b36]">
                              <span>◷</span>
                              Pendente
                            </span>
                          )}
                        </td>

                        <td className="max-w-xs px-5 py-4 text-[#786873]">
                          <span
                            title={lead.mensagem || ""}
                            className="block truncate"
                          >
                            {lead.mensagem || "Sem mensagem"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}

                </tbody>
              </table>
            </div>

            {/* PAGINAÇÃO */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#f1e9ed] px-6 py-5">

              <p className="text-sm text-[#897982]">
                {total === 0 ? (
                  "Nenhum registro para exibir"
                ) : (
                  <>
                    Exibindo{" "}
                    <strong className="text-[#554650]">
                      {(pagina - 1) * limite + 1}
                      {"–"}
                      {Math.min(pagina * limite, total)}
                    </strong>
                    {" "}de{" "}
                    <strong className="text-[#554650]">
                      {total}
                    </strong>
                    {" "}leads
                  </>
                )}
              </p>

              <div className="flex items-center gap-3">

                <span className="text-xs text-[#9b8c94]">
                  {totalPaginas === 0
                    ? "Sem páginas"
                    : `Página ${pagina} de ${totalPaginas}`}
                </span>

                <button
                  onClick={() => {
                    setCarregando(true);
                    setPagina((atual) => atual - 1);
                  }}
                  disabled={pagina <= 1 || carregando}
                  className="rounded-lg border border-[#e8d8df] px-4 py-2.5 text-sm font-medium text-[#9b607c] transition hover:bg-[#faf1f5] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>

                <button
                  onClick={() => {
                    setCarregando(true);
                    setPagina((atual) => atual + 1);
                  }}
                  disabled={pagina >= totalPaginas || carregando}
                  className="rounded-lg border border-[#e8d8df] px-4 py-2.5 text-sm font-medium text-[#9b607c] transition hover:bg-[#faf1f5] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Próxima
                </button>

              </div>
            </div>
          </div>

          {/* RODAPÉ */}
          <footer className="mt-10 border-t border-[#eadfe4] py-6 text-center">
            <p className="font-serif text-sm text-[#a18493]">
              Produções da Vick Crochê
            </p>

            <p className="mt-1 text-xs text-[#b4a5ac]">
              Área administrativa
            </p>
          </footer>

        </section>
      </div>
    </main>
  );
}
