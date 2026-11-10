
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setErro("");
    setCarregando(true);

    try {
      const resposta = await fetch("/api/admin/autenticacao/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.mensagem || "Não foi possível realizar o login.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (erro) {
      console.error("Erro ao realizar login:", erro);
      setErro("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#faf6f7] lg:grid-cols-2">

      {/* PAINEL DE IDENTIDADE VISUAL */}
      <section className="relative flex min-h-[300px] flex-col items-center justify-center overflow-hidden bg-[#f2e4ea] px-6 py-12 lg:min-h-screen">

        {/* Elementos decorativos */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full border border-white/50" />
        <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full border-[35px] border-white/25" />

        <div className="relative z-10 flex max-w-md flex-col items-center text-center">

          <Image
            src="/images/Logo - Produções da Vick croche.svg"
            alt="Produções da Vick Crochê"
            width={250}
            height={250}
            priority
            className="mb-8 h-auto w-40 object-contain sm:w-48 lg:w-56"
          />

          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a36583]">
            Produções da Vick Crochê
          </span>

          <h1 className="mt-5 font-serif text-3xl leading-tight text-[#493b43] sm:text-4xl">
            Feito à mão,
            <br />
            com carinho e dedicação.
          </h1>

          <p className="mt-5 max-w-sm text-sm leading-7 text-[#806c77] sm:text-base">
            Um espaço dedicado ao gerenciamento e acompanhamento
            das atividades da nossa loja.
          </p>

          <div className="mt-9 h-px w-16 bg-[#c18da5]" />

          <p className="mt-5 font-serif text-sm italic text-[#a36583]">
            Cada detalhe importa.
          </p>
        </div>
      </section>

      {/* PAINEL DE LOGIN */}
      <section className="flex min-h-[600px] items-center justify-center px-6 py-14 sm:px-10 lg:min-h-screen">

        <div className="w-full max-w-md">

          <div className="mb-10 text-center lg:text-left">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b58a9e]">
              Acesso restrito
            </span>

            <h2 className="mt-3 font-serif text-3xl text-[#42343c] sm:text-4xl">
              Área administrativa
            </h2>

            <p className="mt-4 text-sm leading-6 text-[#897982]">
              Entre com suas credenciais para acessar o painel
              de gerenciamento da loja.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* E-MAIL */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-[#554650]"
              >
                E-mail
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Digite seu e-mail"
                autoComplete="username"
                required
                className="w-full rounded-xl border border-[#e8d8df] bg-white px-4 py-3.5 text-sm text-[#493b43] outline-none transition placeholder:text-[#b5a5ad] hover:border-[#d6b5c4] focus:border-[#ad718e] focus:ring-4 focus:ring-[#ad718e]/10"
              />
            </div>

            {/* SENHA */}
            <div>
              <label
                htmlFor="senha"
                className="mb-2 block text-sm font-semibold text-[#554650]"
              >
                Senha
              </label>

              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-[#e8d8df] bg-white px-4 py-3.5 text-sm text-[#493b43] outline-none transition placeholder:text-[#b5a5ad] hover:border-[#d6b5c4] focus:border-[#ad718e] focus:ring-4 focus:ring-[#ad718e]/10"
              />
            </div>

            {/* ERRO */}
            {erro && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
              >
                {erro}
              </div>
            )}

            {/* BOTÃO */}
            <button
              type="submit"
              disabled={carregando}
              className="w-full rounded-xl bg-[#ad718e] px-5 py-4 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-[#965b78] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando ? "Verificando acesso..." : "Entrar na área administrativa"}
            </button>

          </form>

          {/* VOLTAR À LOJA */}
          <div className="mt-9 border-t border-[#eadfe4] pt-6 text-center">
            <Link
              href="/"
              className="text-sm font-medium text-[#a36583] transition hover:text-[#80465f]"
            >
              ← Voltar para a loja
            </Link>
          </div>

          <p className="mt-10 text-center text-xs text-[#b2a1aa]">
            Produções da Vick Crochê
          </p>

        </div>
      </section>
    </main>
  );
}
