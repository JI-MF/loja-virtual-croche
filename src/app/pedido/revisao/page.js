
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RevisaoPedidoPage() {
  const router = useRouter();

  const [produto, setProduto] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarProduto() {
      try {
        const parametros = new URLSearchParams(window.location.search);
        const produtoId = parametros.get("produto");

        if (!produtoId || !/^\d+$/.test(produtoId)) {
          setErro("Nenhum produto válido foi selecionado.");
          return;
        }

        const resposta = await fetch("/api/produtos");
        const dados = await resposta.json();

        if (!resposta.ok) {
          throw new Error("Não foi possível carregar os produtos.");
        }

        const lista = Array.isArray(dados) ? dados : dados.produtos;

        if (!Array.isArray(lista)) {
          throw new Error("Formato de resposta dos produtos inválido.");
        }

        const selecionado = lista.find(
          (item) => String(item.id) === produtoId
        );

        if (!selecionado) {
          setErro("O produto selecionado não foi encontrado.");
          return;
        }

        setProduto(selecionado);
      } catch (erro) {
        setErro(erro.message || "Erro ao carregar o produto.");
      } finally {
        setCarregando(false);
      }
    }

    carregarProduto();
  }, []);

  const preco = Number(
    produto?.preco ?? produto?.valor ?? produto?.preco_unitario ?? 0
  );

  const estoque = Number(produto?.estoque ?? 0);
  const total = preco * quantidade;

  async function confirmarPedido() {
    setErro("");

    if (!produto || quantidade < 1 || quantidade > estoque) {
      setErro("Confira a quantidade disponível para este produto.");
      return;
    }

    try {
      setProcessando(true);

      const respostaPedido = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itens: [
            {
              produto_id: produto.id,
              quantidade,
            },
          ],
        }),
      });

      const resultadoPedido = await respostaPedido.json();

      if (!respostaPedido.ok) {
        throw new Error(
          resultadoPedido.mensagem ||
            resultadoPedido.erro ||
            "Não foi possível criar o pedido."
        );
      }

      const pedidoId =
        resultadoPedido.pedido?.id ?? resultadoPedido.id;

      if (!pedidoId) {
        throw new Error(
          "O pedido foi enviado, mas não foi possível identificar seu número."
        );
      }

      const respostaCheckout = await fetch(
        `/api/pedidos/${pedidoId}/checkout`,
        { method: "POST" }
      );

      const resultadoCheckout = await respostaCheckout.json();

      if (!respostaCheckout.ok) {
        throw new Error(
          resultadoCheckout.mensagem ||
            resultadoCheckout.erro ||
            "Pedido criado, mas não foi possível iniciar o pagamento."
        );
      }

      if (!resultadoCheckout.checkout_url) {
        throw new Error(
          "O checkout foi solicitado, mas o endereço de pagamento não foi retornado."
        );
      }

      window.location.href = resultadoCheckout.checkout_url;
    } catch (erro) {
      setErro(erro.message || "Ocorreu um erro ao processar o pedido.");
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) {
    return <main style={estilos.pagina}>Carregando produto...</main>;
  }

  if (erro && !produto) {
    return (
      <main style={estilos.pagina}>
        <section style={estilos.cartao}>
          <h1>Não foi possível carregar o pedido</h1>
          <p role="alert" style={estilos.erro}>{erro}</p>
          <button style={estilos.botaoSecundario} onClick={() => router.push("/")}>
            Voltar à loja
          </button>
        </section>
      </main>
    );
  }

  return (
    <main style={estilos.pagina}>
      <section style={estilos.cartao}>
        <p style={estilos.subtitulo}>PRODUÇÕES DA VICK CROCHÊ</p>
        <h1 style={estilos.titulo}>Revise seu pedido</h1>
        <p style={estilos.descricao}>
          Confira o produto e a quantidade antes de continuar para o pagamento.
        </p>

        {produto && (
          <>
            <div style={estilos.produto}>
              <div>
                <h2 style={estilos.nomeProduto}>{produto.nome}</h2>
                <p>Preço unitário: {preco.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}</p>
                <p>Estoque disponível: {estoque}</p>
              </div>
            </div>

            <label htmlFor="quantidade" style={estilos.label}>
              Quantidade
            </label>
            <input
              id="quantidade"
              type="number"
              min="1"
              max={estoque}
              value={quantidade}
              onChange={(event) => {
                const valor = Number(event.target.value);
                setQuantidade(valor);
              }}
              style={estilos.campo}
            />

            <div style={estilos.total}>
              <span>Total dos produtos</span>
              <strong>
                {total.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>
            </div>

            <p style={estilos.aviso}>
              O valor definitivo será validado pelo servidor ao criar o pedido.
              Eventuais custos de entrega ainda poderão ser apresentados
              conforme as regras da loja.
            </p>

            {erro && <p role="alert" style={estilos.erro}>{erro}</p>}

            <button
              type="button"
              onClick={confirmarPedido}
              disabled={
                processando ||
                estoque < 1 ||
                quantidade < 1 ||
                quantidade > estoque
              }
              style={estilos.botao}
            >
              {processando ? "Preparando pagamento..." : "Confirmar e ir para pagamento"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              disabled={processando}
              style={estilos.botaoSecundario}
            >
              Voltar à loja
            </button>
          </>
        )}
      </section>
    </main>
  );
}

const estilos = {
  pagina: {
    minHeight: "100vh",
    padding: "40px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f3ef",
    fontFamily: "Arial, sans-serif",
  },
  cartao: {
    width: "100%",
    maxWidth: "620px",
    padding: "32px",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
  },
  subtitulo: {
    color: "#94664f",
    fontSize: "12px",
    letterSpacing: "2px",
    fontWeight: "bold",
  },
  titulo: {
    fontSize: "30px",
    color: "#333333",
    marginBottom: "12px",
  },
  descricao: {
    color: "#666666",
    lineHeight: 1.6,
    marginBottom: "24px",
  },
  produto: {
    padding: "20px 0",
    borderTop: "1px solid #eeeeee",
    borderBottom: "1px solid #eeeeee",
    marginBottom: "24px",
  },
  nomeProduto: {
    fontSize: "21px",
    marginBottom: "12px",
  },
  label: {
    display: "block",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  campo: {
    display: "block",
    width: "100%",
    padding: "12px",
    marginBottom: "24px",
    border: "1px solid #cccccc",
    borderRadius: "6px",
    fontSize: "16px",
  },
  total: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    padding: "20px 0",
    fontSize: "18px",
    borderTop: "1px solid #eeeeee",
  },
  aviso: {
    color: "#666666",
    fontSize: "13px",
    lineHeight: 1.5,
    marginBottom: "20px",
  },
  botao: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#94664f",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: "12px",
  },
  botaoSecundario: {
    width: "100%",
    padding: "12px",
    border: "1px solid #94664f",
    borderRadius: "6px",
    backgroundColor: "#ffffff",
    color: "#94664f",
    fontSize: "15px",
    cursor: "pointer",
  },
  erro: {
    color: "#b42318",
    marginBottom: "16px",
    lineHeight: 1.5,
  },
};
