"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import styles from "./page.module.css";

export default function ProdutosPage() {
  const router = useRouter();
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    async function carregarProdutos() {
      try {
        const response = await fetch("/api/produtos");

        if (!response.ok) {
          throw new Error("Não foi possível carregar os produtos.");
        }

        const dados = await response.json();

        if (!Array.isArray(dados)) {
          throw new Error("Resposta inválida da API.");
        }

        setProdutos(dados);
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        setErro(true);
      } finally {
        setCarregando(false);
      }
    }

    carregarProdutos();
  }, []);

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

        <h1>Todos os produtos</h1>

        <p className={styles.description}>
          Explore nossas peças de crochê feitas à mão,
          com cuidado e dedicação.
        </p>
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
        ) : produtos.length === 0 ? (
          <p className={styles.mensagem}>
            Nenhum produto disponível no momento.
          </p>
        ) : (
          <>
            <p className={styles.quantidade}>
              {produtos.length}{" "}
              {produtos.length === 1
                ? "produto encontrado"
                : "produtos encontrados"}
            </p>

            <div className={styles.productList}>
              {produtos.map((produto) => (
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
