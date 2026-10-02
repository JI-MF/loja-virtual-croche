"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { cadastroSchema } from "@/lib/cadastro-schema";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function CadastroForm({produtoId}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(cadastroSchema),

    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      mensagem: "",
    },
  });

  async function onSubmit(data) {
    try {
      const response = await fetch("/api/cadastro", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...data,
          produto_id: produtoId,
        }),
      });

      const resultado = await response.json();

      if (!response.ok) {
        if (resultado.campos) {
          resultado.campos.forEach((erro) => {
            setError(erro.campo, {
              type: "server",
              message: erro.mensagem,
            });
          });
        }

        return;
      }

      alert("Cadastro realizado com sucesso!");

      reset();

    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-lg space-y-6"
    >

      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="nome">
          Nome
        </Label>

        <Input
          id="nome"
          type="text"
          placeholder="Digite seu nome"
          {...register("nome")}
        />

        {errors.nome && (
          <p className="text-sm text-red-500">
            {errors.nome.message}
          </p>
        )}
      </div>


      {/* E-mail */}
      <div className="space-y-2">
        <Label htmlFor="email">
          E-mail
        </Label>

        <Input
          id="email"
          type="email"
          placeholder="Digite seu e-mail"
          {...register("email")}
        />

        {errors.email && (
          <p className="text-sm text-red-500">
            {errors.email.message}
          </p>
        )}
      </div>


      {/* Telefone */}
      <div className="space-y-2">
        <Label htmlFor="telefone">
          Telefone
        </Label>

        <Input
          id="telefone"
          type="tel"
          placeholder="(92) 99999-9999"
          {...register("telefone")}
        />

        {errors.telefone && (
          <p className="text-sm text-red-500">
            {errors.telefone.message}
          </p>
        )}
      </div>


      {/* Mensagem */}
      <div className="space-y-2">
        <Label htmlFor="mensagem">
          Mensagem
        </Label>

        <Textarea
          id="mensagem"
          placeholder="Digite sua mensagem"
          rows={5}
          {...register("mensagem")}
        />

        {errors.mensagem && (
          <p className="text-sm text-red-500">
            {errors.mensagem.message}
          </p>
        )}
      </div>


      {/* Botão */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Enviando..." : "Enviar"}
      </Button>

    </form>
  );
}