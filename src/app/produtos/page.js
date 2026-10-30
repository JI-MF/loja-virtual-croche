
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import styles from "./page.module.css";

export default function ProdutosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoriaId = searchParams.get("categoria");

  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      try {
        const [resProdutos, resCategorias] = await Promise.all([
          fetch("/api/produtos"),
          fetch("/api/categorias"),
        ]);

        if (!resProdutos.ok || !resCategorias.ok) {
          throw new Error("Não foi possível carregar os dados.");
        }

        const dadosProdutos = await resProdutos.json();
        const dadosCategorias = await resCategorias.json();

        if (
          !Array.isArray(dadosProdutos) ||
          !Array.isArray(dadosCategorias)
        ) {
          throw new Error("Resposta inválida da API.");
        }

        setProdutos(dadosProdutos);
        setCategorias(dadosCategorias);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setErro(true);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  const categoriaSelecionada = categorias.find(
    (categoria) => String(categoria.id) === categoriaId
  );

  const produtosFiltrados = categoriaId
    ? produtos.filter(
        (produto) => String(produto.categoria_id) === categoriaId
      )
    : produtos;

  function comprarProduto(produto) {
    router.push(`/autenticacao?produto=${produto.id}`);
  }

  function tirarDuvidas(produto) {
    const mensagem =
      `Olá! Tenho interesse no produto ${produto.nome}. ` +
      "Gostaria de tirar algumas dúvidas.";

    const url =
      `https://wa.me/559285040893?text=${encodeURIComponent(mensagem)}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.voltar}>
          ← Voltar para a página inicial
        </Link>

        <p className={styles.subtitle}>NOSSA COLEÇÃO</p>

        <h1>
          {categoriaSelecionada
            ? categoriaSelecionada.nome
            : "Todos os produtos"}
        </h1>

        <p className={styles.description}>
          {categoriaSelecionada
            ? `Confira nossos produtos da categoria ${categoriaSelecionada.nome}.`
            : "Explore nossas peças de crochê feitas à mão, com cuidado e dedicação."}
        </p>

        {categoriaId && (
          <Link href="/produtos">
            Ver todos os produtos
          </Link>
        )}
      </header>

      <section className={styles.products}>
        {carregando ? (
          <p className={styles.mensagem}>
            Carregando produtos...
          </p>
        ) : erro ? (
          <p className={styles.mensagem}>
            Não foi possível carregar os produtos.
            Tente novamente mais tarde.
          </p>
        ) : categoriaId && !categoriaSelecionada ? (
          <p className={styles.mensagem}>
            Categoria não encontrada.
          </p>
        ) : produtosFiltrados.length === 0 ? (
          <p className={styles.mensagem}>
            Nenhum produto encontrado nesta categoria.
          </p>
        ) : (
          <>
            <p className={styles.quantidade}>
              {produtosFiltrados.length}{" "}
              {produtosFiltrados.length === 1
                ? "produto encontrado"
                : "produtos encontrados"}
            </p>

            <div className={styles.productList}>
              {produtosFiltrados.map((produto) => (
                <article
                  key={produto.id}
                  className={styles.product}
                >
                  <div className={styles.productImage}>
                    {produto.imagem_url ? (
                      <Image
                        src={produto.imagem_url}
                        alt={produto.nome}
                        fill
                        sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                        className={styles.image}
                      />
                    ) : (
                      <span>Sem imagem</span>
                    )}
                  </div>

                  <div className={styles.productInfo}>
                    <h2>{produto.nome}</h2>

                    <p className={styles.price}>
                      R${" "}
                      {Number(produto.preco)
                        .toFixed(2)
                        .replace(".", ",")}
                    </p>

                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.buyButton}
                        onClick={() => comprarProduto(produto)}
                      >
                        Comprar produto
                      </button>

                      <button
                        type="button"
                        className={styles.whatsappButton}
                        onClick={() => tirarDuvidas(produto)}
                      >
                        Tirar dúvidas
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
