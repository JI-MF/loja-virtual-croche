import Image from "next/image";
import styles from "./page.module.css";


export default function Home(){
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
          <a href="#">Produtos</a>
          <a href="#">Categorias</a>
          <a href="#">Contato</a>
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

            <button className={styles.button}>
              Ver produtos
            </button>

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

        <section className={styles.products}>

          <div className={styles.sectionTitle}>

            <div>
              <p>CONFIRA</p>
              <h2>Produtos em destaque</h2>
            </div>

            <a href="#">
              Ver todos →
            </a>

          </div>


          <div className={styles.productList}>

            <article className={styles.product}>

              <div className={styles.productImage}>
                Produto 01
              </div>

              <h3>Bolsa de Crochê</h3>
              <p>R$ 89,90</p>

            </article>


            <article className={styles.product}>

              <div className={styles.productImage}>
                Produto 02
              </div>

              <h3>Blusa de Crochê</h3>
              <p>R$ 119,90</p>

            </article>


            <article className={styles.product}>

              <div className={styles.productImage}>
                Produto 03
              </div>

              <h3>Amigurumi</h3>
              <p>R$ 59,90</p>

            </article>

          </div>

        </section>

      </main>
    </div>
  )
}



//       <main>

//         <section className={styles.hero}>
//           <div className={styles.heroContent}>
//             <p className={styles.subtitle}>
//               NOVA COLEÇÃO
//             </p>

//             <h1>
//               Seu estilo.
//               <br />
//               Sua identidade.
//             </h1>

//             <p className={styles.description}>
//               Encontre peças que combinam com você
//               e transforme seu estilo.
//             </p>

//             <button className={styles.button}>
//               Ver produtos
//             </button>
//           </div>
//         </section>


//         <section className={styles.categories}>
//           <h2>Categorias</h2>

//           <div className={styles.categoryList}>
//             <div className={styles.category}>
//               <span>01</span>
//               <h3>Vestidos</h3>
//             </div>

//             <div className={styles.category}>
//               <span>02</span>
//               <h3>Blusas</h3>
//             </div>

//             <div className={styles.category}>
//               <span>03</span>
//               <h3>Calças</h3>
//             </div>

//             <div className={styles.category}>
//               <span>04</span>
//               <h3>Croppeds</h3>
//             </div>
//           </div>
//         </section>


//         <section className={styles.products}>
//           <div className={styles.sectionTitle}>
//             <div>
//               <p>CONFIRA</p>
//               <h2>Produtos em destaque</h2>
//             </div>

//             <a href="#">
//               Ver todos →
//             </a>
//           </div>


//           <div className={styles.productList}>

//             <article className={styles.product}>
//               <div className={styles.productImage}>
//                 Produto 01
//               </div>

//               <h3>Vestido Elegance</h3>
//               <p>R$ 129,90</p>
//             </article>


//             <article className={styles.product}>
//               <div className={styles.productImage}>
//                 Produto 02
//               </div>

//               <h3>Blusa Essential</h3>
//               <p>R$ 79,90</p>
//             </article>


//             <article className={styles.product}>
//               <div className={styles.productImage}>
//                 Produto 03
//               </div>

//               <h3>Calça Wide</h3>
//               <p>R$ 149,90</p>
//             </article>

//           </div>
//         </section>

//       </main>

//     </div>
//   );
// }