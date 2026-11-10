
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  const [admin, setAdmin] = useState(null);
  const [carregando, setCarregando] = useState(true);
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
          setErro(dados.mensagem || "Não foi possível verificar a sessão.");
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
    try {
      const resposta = await fetch("/api/admin/autenticacao/logout", {
        method: "POST",
      });

      if (!resposta.ok) {
        setErro("Não foi possível realizar o logout.");
        return;
      }

      router.replace("/admin/login");
      router.refresh();
    } catch (erro) {
      console.error("Erro ao sair:", erro);
      setErro("Não foi possível conectar ao servidor.");
    }
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Verificando autenticação...</p>
      </main>
    );
  }

  if (erro && !admin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="mb-4 text-red-600">{erro}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-gray-900 px-5 py-2 text-white"
          >
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Painel Administrativo
          </h1>
          <p className="text-sm text-gray-500">
            Produções da Vick Crochê
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-700"
        >
          Sair
        </button>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800">
            Bem-vindo(a), {admin.nome}!
          </h2>

          <p className="mt-2 text-gray-600">
            Você está autenticado na área administrativa.
          </p>

          <p className="mt-4 text-sm text-gray-500">
            E-mail: {admin.email}
          </p>
        </div>
      </section>
    </main>
  );
}
