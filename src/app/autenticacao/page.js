
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AutenticacaoPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [etapa, setEtapa] = useState("email");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function solicitarCodigo(event) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    try {
      setCarregando(true);

      const response = await fetch(
        "/api/autenticacao/solicitar-codigo",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const resultado = await response.json();

      if (!response.ok) {
        setErro(resultado.mensagem || "Não foi possível solicitar o código.");
        return;
      }

      setMensagem(resultado.mensagem);
      setEtapa("codigo");
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  }

  async function validarCodigo(event) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    if (!/^\d{6}$/.test(codigo)) {
      setErro("Digite um código de seis dígitos.");
      return;
    }

    try {
      setCarregando(true);

      const response = await fetch(
        "/api/autenticacao/validar",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, codigo }),
        }
      );

      const resultado = await response.json();

      if (!response.ok) {
        setErro(resultado.mensagem || "Não foi possível validar o código.");
        return;
      }

      setMensagem("Autenticação realizada com sucesso.");

      // Por enquanto, encaminha para a página inicial.
      // Depois conectaremos esta etapa à revisão do pedido.
      const parametros = new URLSearchParams(window.location.search);
const produtoId = parametros.get("produto");

    if (produtoId) {
    router.push(`/pedido/revisao?produto=${produtoId}`);
    } else {
    router.push("/");
    }

    router.refresh();
    } catch {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main style={estilos.pagina}>
      <section style={estilos.cartao}>
        <p style={estilos.subtitulo}>PRODUÇÕES DA VICK CROCHÊ</p>

        <h1 style={estilos.titulo}>Acesse sua conta</h1>

        <p style={estilos.descricao}>
          Entre para continuar sua experiência de compra.
        </p>

        {etapa === "email" ? (
          <form onSubmit={solicitarCodigo} style={estilos.formulario}>
            <label htmlFor="email" style={estilos.label}>
              E-mail cadastrado
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Digite seu e-mail"
              required
              style={estilos.campo}
            />

            <button
              type="submit"
              disabled={carregando}
              style={estilos.botao}
            >
              {carregando ? "Enviando..." : "Enviar código de acesso"}
            </button>
          </form>
        ) : (
          <form onSubmit={validarCodigo} style={estilos.formulario}>
            <p style={estilos.descricao}>
              Informe o código enviado para {email}.
            </p>

            <label htmlFor="codigo" style={estilos.label}>
              Código de seis dígitos
            </label>

            <input
              id="codigo"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={codigo}
              onChange={(event) =>
                setCodigo(event.target.value.replace(/\D/g, ""))
              }
              placeholder="000000"
              required
              style={estilos.campo}
            />

            <button
              type="submit"
              disabled={carregando}
              style={estilos.botao}
            >
              {carregando ? "Verificando..." : "Validar código"}
            </button>

            <button
              type="button"
              onClick={() => {
                setEtapa("email");
                setCodigo("");
                setErro("");
                setMensagem("");
              }}
              style={estilos.botaoSecundario}
            >
              Voltar
            </button>
          </form>
        )}

        {mensagem && (
          <p role="status" style={estilos.sucesso}>
            {mensagem}
          </p>
        )}

        {erro && (
          <p role="alert" style={estilos.erro}>
            {erro}
          </p>
        )}

        <p style={estilos.rodape}>
          Ainda não tem conta? O cadastro de cliente será disponibilizado
          aqui na próxima etapa.
        </p>
      </section>
    </main>
  );
}

const estilos = {
  pagina: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    backgroundColor: "#faf6f8",
  },
  cartao: {
    width: "100%",
    maxWidth: "440px",
    padding: "36px",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.06)",
  },
  subtitulo: {
    color: "#a86f8a",
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "2px",
    textAlign: "center",
  },
  titulo: {
    margin: "16px 0",
    color: "#333333",
    fontSize: "28px",
    textAlign: "center",
  },
  descricao: {
    marginBottom: "24px",
    color: "#666666",
    lineHeight: 1.6,
    textAlign: "center",
  },
  formulario: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  label: {
    color: "#333333",
    fontSize: "14px",
    fontWeight: "500",
  },
  campo: {
    width: "100%",
    padding: "12px",
    border: "1px solid #dddddd",
    borderRadius: "6px",
    fontSize: "16px",
    boxSizing: "border-box",
  },
  botao: {
    marginTop: "8px",
    padding: "13px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#a86f8a",
    color: "#ffffff",
    fontSize: "15px",
    cursor: "pointer",
  },
  botaoSecundario: {
    padding: "10px",
    border: "1px solid #dddddd",
    borderRadius: "6px",
    backgroundColor: "#ffffff",
    color: "#333333",
    cursor: "pointer",
  },
  sucesso: {
    marginTop: "16px",
    color: "#287a46",
    fontSize: "14px",
  },
  erro: {
    marginTop: "16px",
    color: "#c0392b",
    fontSize: "14px",
  },
  rodape: {
    marginTop: "24px",
    color: "#777777",
    fontSize: "13px",
    lineHeight: 1.5,
    textAlign: "center",
  },
};
