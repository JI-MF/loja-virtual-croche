
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function AdminPage() {
  const router = useRouter();

  const [admin, setAdmin] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function verificarSessao() {
      try {
        const resposta = await fetch("/api/admin/sessao", {
          method: "GET",
          cache: "no-store",
        });

        if (resposta.status === 401) {
          router.replace("/admin/login");
          return;
        }

        const dados = await resposta.json();

        if (!resposta.ok) {
          setErro(
            dados.mensagem ||
              "Não foi possível verificar a sessão."
          );
          return;
        }

        setAdmin(dados.admin);
      } catch (erro) {
        console.error("Erro ao verificar sessão:", erro);
        setErro("Não foi possível conectar ao servidor.");
      } finally {
        setCarregando(false);
      }
    }

    verificarSessao();
  }, [router]);

  async function handleLogout() {
    setSaindo(true);
    setErro("");

    try {
      const resposta = await fetch(
        "/api/admin/autenticacao/logout",
        { method: "POST" }
      );

      if (!resposta.ok) {
        setErro("Não foi possível realizar o logout.");
        setSaindo(false);
        return;
      }

      router.replace("/admin/login");
      router.refresh();
    } catch (erro) {
      console.error("Erro ao sair:", erro);
      setErro("Não foi possível conectar ao servidor.");
      setSaindo(false);
    }
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf6f7]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#ead8e0] border-t-[#ad718e]" />
          <p className="text-sm text-[#806b75]">
            Verificando autenticação...
          </p>
        </div>
      </main>
    );
  }

  if (erro && !admin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf6f7] px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="mb-5 text-sm text-red-600">{erro}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-[#ad718e] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#965b78]"
          >
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  if (!admin) return null;

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
            className="flex shrink-0 items-center gap-3 rounded-xl bg-[#f7edf1] px-4 py-3 text-sm font-semibold text-[#a36583] transition"
          >
            <span className="text-lg">⌂</span>
            Início
          </Link>

          <Link
            href="/admin/leads"
            className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#665961] transition hover:bg-[#faf3f6] hover:text-[#a36583]"
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
              Área administrativa
            </p>
            <h1 className="mt-1 font-serif text-xl text-[#393236]">
              Painel de gerenciamento
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[#51434b]">
                {admin.nome}
              </p>
              <p className="text-xs text-[#9b8c94]">
                Administrador
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3e5eb] font-serif text-lg text-[#a36583]">
              {admin.nome.charAt(0).toUpperCase()}
            </div>

            <button
              onClick={handleLogout}
              disabled={saindo}
              className="rounded-lg border border-[#e8d8df] px-4 py-2.5 text-sm font-medium text-[#9b607c] transition hover:bg-[#faf1f5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saindo ? "Saindo..." : "Sair"}
            </button>
          </div>
        </header>

        {/* CONTEÚDO */}
        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-10 sm:py-12">

          {erro && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700"
            >
              {erro}
            </div>
          )}

          {/* BOAS-VINDAS */}
          <div className="relative overflow-hidden rounded-2xl bg-[#f2e4ea] px-7 py-10 sm:px-10 sm:py-12">
            <div className="relative z-10 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#a36583]">
                Bem-vindo(a) ao seu espaço
              </p>

              <h2 className="mt-4 font-serif text-3xl leading-tight text-[#42343c] sm:text-4xl">
                Olá, {admin.nome}!
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-[#78636e] sm:text-base">
                Gerencie os contatos e acompanhe os pedidos da
                Produções da Vick Crochê em um só lugar.
              </p>
            </div>

            <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[35px] border-white/25" />
            <div className="pointer-events-none absolute -bottom-28 right-28 h-64 w-64 rounded-full border-[25px] border-white/20" />
          </div>

          {/* ACESSOS RÁPIDOS */}
          <div className="mt-10">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b58a9e]">
                Gerenciamento
              </p>
              <h2 className="mt-2 font-serif text-2xl text-[#42343c]">
                O que deseja consultar?
              </h2>
              <p className="mt-2 text-sm text-[#8d7c85]">
                Escolha uma das opções para acessar as informações da loja.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">

              {/* LEADS */}
              <Link
                href="/admin/leads"
                className="group rounded-2xl border border-[#eee2e8] bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#d9b9c8] hover:shadow-md sm:p-8"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8edf2] text-2xl text-[#ad718e] transition group-hover:bg-[#f1dfe8]">
                  ♡
                </div>

                <h3 className="mt-6 font-serif text-xl text-[#493b43]">
                  Leads cadastrados
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#897982]">
                  Consulte os contatos registrados na loja, pesquise
                  clientes e verifique a situação dos cadastros.
                </p>

                <div className="mt-7 flex items-center justify-between border-t border-[#f1e9ed] pt-5">
                  <span className="text-sm font-semibold text-[#a36583]">
                    Acessar leads
                  </span>
                  <span className="text-xl text-[#ad718e] transition group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>

              {/* PEDIDOS */}
              <Link
                href="/admin/pedidos"
                className="group rounded-2xl border border-[#eee2e8] bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#d9b9c8] hover:shadow-md sm:p-8"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8edf2] text-2xl text-[#ad718e] transition group-hover:bg-[#f1dfe8]">
                  ▤
                </div>

                <h3 className="mt-6 font-serif text-xl text-[#493b43]">
                  Pedidos
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#897982]">
                  Acompanhe os pedidos realizados, consulte seus
                  detalhes e atualize o andamento das entregas.
                </p>

                <div className="mt-7 flex items-center justify-between border-t border-[#f1e9ed] pt-5">
                  <span className="text-sm font-semibold text-[#a36583]">
                    Gerenciar pedidos
                  </span>
                  <span className="text-xl text-[#ad718e] transition group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>

            </div>
          </div>

          {/* RODAPÉ */}
          <footer className="mt-14 border-t border-[#eadfe4] py-6 text-center">
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
