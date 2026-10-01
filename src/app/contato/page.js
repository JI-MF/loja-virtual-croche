import CadastroForm from "@/components/cadastro-form";

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-12">
      
      <section className="mx-auto max-w-2xl">

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Entre em contato
          </h1>

          <p className="mt-2 text-muted-foreground">
            Preencha o formulário e entraremos em contato com você.
          </p>
        </div>

        <CadastroForm />

      </section>

    </main>
  );
}