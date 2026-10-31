
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function FormularioAutenticacao() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const produtoId = searchParams.get("produto");

  const [etapa, setEtapa] = useState("cadastro");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [codigo, setCodigo] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  function limparMensagens() {
    setErro("");
    setMensagem("");
  }

  function alternarEtapa(novaEtapa) {
    limparMensagens();
    setCodigo("");
    setEtapa(novaEtapa);
  }

  async function enviarRequisicao(url, dados) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    });

    const resultado = await response.json();

    if (!response.ok) {
      const mensagemErro =
        resultado.mensagem || "Não foi possível concluir a operação.";

      if (response.status === 409) {
        setErro(mensagemErro);
      } else if (resultado.erros?.length) {
        setErro(
          resultado.erros
            .map((item) => item.mensagem)
            .join(" ")
        );
      } else {
        setErro(mensagemErro);
      }

      return false;
    }

    setMensagem(resultado.mensagem || "Operação realizada com sucesso.");

    return true;
  }

  async function cadastrarCliente(event) {
    event.preventDefault();
    limparMensagens();

    try {
      setCarregando(true);

      const sucesso = await enviarRequisicao(
        "/api/autenticacao/cadastro",
        {
          nome,
          email: email.trim().toLowerCase(),
          telefone,
        }
      );

      if (sucesso) {
        setEmail(email.trim().toLowerCase());
        setEtapa("codigo");
      }
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  }

  async function solicitarCodigo(event) {
    event.preventDefault();
    limparMensagens();

    try {
      setCarregando(true);

      const sucesso = await enviarRequisicao(
        "/api/autenticacao/solicitar-codigo",
        {
          email: email.trim().toLowerCase(),
        }
      );

      if (sucesso) {
        setEtapa("codigo");
      }
    } catch (error) {
      console.error("Erro ao solicitar códgio:", error);
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  }

  async function validarCodigo(event) {
    event.preventDefault();
    limparMensagens();

    if (!/^\d{6}$/.test(codigo)) {
      setErro("Digite um código de seis dígitos.");
      return;
    }

    try {
      setCarregando(true);

      const sucesso = await enviarRequisicao(
        "/api/autenticacao/validar",
        {
          email: email.trim().toLowerCase(),
          codigo,
        }
      );

      if (sucesso) {
        const destino = produtoId
          ? `/pedido/revisao?produto=${encodeURIComponent(produtoId)}`
          : "/";

        router.replace(destino);
        router.refresh();
      }
    } catch (error) {
      console.error("Erro ao validar códgio:", error);
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main style={estilos.pagina}>
      <section style={estilos.cartao}>
        <p style={estilos.subtitulo}>
          PRODUÇÕES DA VICK CROCHÊ
        </p>

        <h1 style={estilos.titulo}>
          {etapa === "cadastro"
            ? "Crie sua conta"
            : etapa === "email"
              ? "Acesse sua conta"
              : "Confirme seu e-mail"}
        </h1>

        <p style={estilos.descricao}>
          {etapa === "cadastro"
            ? "Informe seus dados para continuar sua compra."
            : etapa === "email"
              ? "Informe o e-mail cadastrado para receber seu códgio de acesso."
              : `Digite o códgio de seis dígitos enviado para ${email}.`}
        </p>

        {etapa === "cadastro" && (
          <form
            onSubmit={cadastrarCliente}
            style={estilos.formulario}
          >
            <label htmlFor="nome" style={estilos.label}>
              Nome completo
            </label>

            <input
              id="nome"
              type="text"
              autoComplete="name"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Digite seu nome completo"
              minLength={3}
              required
              style={estilos.campo}
            />

            <label htmlFor="email" style={estilos.label}>
              E-mail
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Digite seu e-mail"
              required
              style={estilos.campo}
            />

            <label htmlFor="telefone" style={estilos.label}>
              Telefone / WhatsApp
            </label>

            <input
              id="telefone"
              type="tel"
              autoComplete="tel"
              value={telefone}
              onChange={(event) => setTelefone(event.target.value)}
              placeholder="(92) 99999-9999"
              required
              style={estilos.campo}
            />

            <button
              type="submit"
              disabled={carregando}
              style={{
                ...estilos.botao,
                ...(carregando ? estilos.botaoDesabilitado : {}),
              }}
            >
              {carregando
                ? "Cadastrando..."
                : "Cadastrar e continuar"}
            </button>

            <button
              type="button"
              onClick={() => alternarEtapa("email")}
              style={estilos.botaoSecundario}
            >
              Já tenho cadastro
            </button>
          </form>
        )}

        {etapa === "email" && (
          <form
            onSubmit={solicitarCodigo}
            style={estilos.formulario}
          >
            <label htmlFor="email-acesso" style={estilos.label}>
              E-mail cadastrado
            </label>

            <input
              id="email-acesso"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Digite seu e-mail"
              required
              style={estilos.campo}
            />

            <button
              type="submit"
              disabled={carregando}
              style={{
                ...estilos.botao,
                ...(carregando ? estilos.botaoDesabilitado : {}),
              }}
            >
              {carregando ? "Enviando..." : "Enviar código de acesso"}
            </button>

            <button
              type="button"
              onClick={() => alternarEtapa("cadastro")}
              style={estilos.botaoSecundario}
            >
              Criar uma conta
            </button>
          </form>
        )}

        {etapa === "codigo" && (
          <form
            onSubmit={validarCodigo}
            style={estilos.formulario}
          >
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
              style={{
                ...estilos.botao,
                ...(carregando ? estilos.botaoDesabilitado : {}),
              }}
            >
              {carregando ? "Verificando..." : "Validar código"}
            </button>

            <button
              type="button"
              disabled={carregando}
              onClick={() => alternarEtapa("email")}
              style={estilos.botaoSecundario}
            >
              Voltar ao acesso
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
          {produtoId
            ? "Após confirmar seu e-mail, você poderá continuar para a revisão do produto selecionado."
            : "Seus dados serão utilizados para identificar sua conta e permitir suas compras."}
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
    boxSizing: "border-box",
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
  botaoDesabilitado: {
    opacity: 0.65,
    cursor: "wait",
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
    lineHeight: 1.5,
  },
  erro: {
    marginTop: "16px",
    color: "#c0392b",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  rodape: {
    marginTop: "24px",
    color: "#777777",
    fontSize: "13px",
    lineHeight: 1.5,
    textAlign: "center",
  },
};

export default function AutenticacaoPage() {
  return (
    <Suspense
      fallback={
        <main style={estilos.pagina}>
          <section style={estilos.cartao}>
            <p style={estilos.descricao}>
              Carregando autenticação...
            </p>
          </section>
        </main>
      }
    >
      <FormularioAutenticacao />
    </Suspense>
  );
}
