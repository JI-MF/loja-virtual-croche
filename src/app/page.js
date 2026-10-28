"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import styles from "./page.module.css";
import CadastroForm from "@/components/cadastro-form";


export default function Home(){

  const [produtos, setProdutos]= useState([]);
  const [produtoSelecionado, setProdutoSelecionado] =useState(null);
  const [mostrarOpções, setMostrarOpções] = useState(false);

  useEffect(() => {
    async function carregarProdutos(){
      try{
        const response = await fetch ("/api/produtos");

        const dados = await response.json();

        setProdutos(dados);
      }
      catch(error){
        console.error("Erro ao carregar os produtos:",error);
      }
    }
    carregarProdutos();
  },[]);
  return(
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Image
            src="/images/Logo - Produções da Vick croche.svg"
            alt="Logo da loja"
            width={150}
            height={50}/>
        </div>

        <nav className={styles.nav}>
          <a href="#">Início</a>
          <a href="#produtos">Produtos</a>
          <a href="#produtos">Ver todos →</a>
          <a href="#">Categorias</a>
          <a href="#contato">Contato</a>
          <a href="#">Como Comprar</a>
          <a href="#">Sobre Nós</a>
        </nav>

        <button className={styles.cart}>
          🛒
        </button>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroContent}>

            <p className={styles.subtitle}>
              NOVA COLEÇÃO
            </p>

            <h1>
              Peças feitas à mão.
              <br />
              Do seu jeito.
            </h1>

            <p className={styles.description}>
              Encontre peças de crochê feitas com
              cuidado e dedicação para você.
            </p>

            <a
              href="#produtos"
              className={styles.button}
            >
              Ver produtos
            </a>

         </div>
        </section>

        <section className={styles.categories}>

          <h2>Categorias</h2>

          <div className={styles.categoryList}>

            <div className={styles.category}>
              <span>01</span>
              <h3>Bolsas</h3>
            </div>

            <div className={styles.category}>
              <span>02</span>
              <h3>Roupas</h3>
            </div>

            <div className={styles.category}>
              <span>03</span>
              <h3>Amigurumis</h3>
            </div>

            <div className={styles.category}>
              <span>04</span>
              <h3>Acessórios</h3>
            </div>

          </div>

        </section>

        {/* PRODUTOS EM DESTAQUE */}

        <section id="produtos" className={styles.products}>

          <div className={styles.sectionTitle}>

            <div>
              <p>CONFIRA</p>
              <h2>Produtos em destaque</h2>
            </div>

            <a href="/produtos">
              Ver todos →
            </a>

          </div>

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
                      width={300}
                      height={300}
                    />
                  ) : (
                    "Sem imagem"
                  )}
                </div>

                <h3>{produto.nome}</h3>

                <p>
                  R$ {Number(produto.preco).toFixed(2).replace(".", ",")}
                </p>

                <button
                type="button"
                className={styles.button}
                onClick={() => {
                  setProdutoSelecionado(produto);
                  setMostrarOpções(true);

                  document
                  .getElementById("contato")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  });
                }

                }
                >
                  Tenho Interesse
                </button>

              </article>
            ))}

          </div>

        </section>

        <section id="contato" className={styles.contact}>

        
{mostrarOpções && produtoSelecionado && (
  <section className={styles.opcoesCompra}>
    <div className={styles.opcoesCompraConteudo}>
      <p className={styles.subtitle}>VAMOS CONTINUAR?</p>

      <h2>Como deseja prosseguir?</h2>

      <p>
        Você selecionou: {produtoSelecionado.nome}
      </p>

      <div className={styles.opcoesCompraBotoes}>
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            window.location.href = `/autenticacao?produto=${produtoSelecionado.id}`;
          }}
        >
          Comprar produto
        </button>

        <button
          type="button"
          className={styles.button}
          onClick={() => {
            const mensagem = `Olá! Tenho interesse no produto ${produtoSelecionado.nome}. Gostaria de tirar algumas dúvidas.`;

            const url = `https://wa.me/559285040893?text=${encodeURIComponent(mensagem)}`;

            window.open(url, "_blank");
          }}
        >
          Tirar dúvidas pelo WhatsApp
        </button>
      </div>
    </div>
  </section>
)}


          <div className={styles.contactContent}>

          <div className={styles.contactText}>
            <p className={styles.subtitle}>
              FALE CONOSCO
            </p>

            <h2>
              Entre em contato
            </h2>

            <p>
              Tem alguma dúvida sobre nossos produtos?
              Preencha o formulário e fale conosco.
            </p>
          </div>

          <CadastroForm produto={produtoSelecionado} />

        </div>

      </section>

      </main>
     </div>
  )
}
