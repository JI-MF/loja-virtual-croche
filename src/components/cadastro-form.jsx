"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { cadastroSchema } from "@/lib/cadastro-schema";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const whatsAppNumero = "559285040893";

export default function CadastroForm({ produto }) {
  const [etapa, setEtapa] = useState("cadastro");
  const [contatoId, setContatoId] = useState(null);
  const [codigo, setCodigo] = useState("");
  const [isVerificando, setIsVerificando] = useState(false);
  const [erroOTP, setErroOTP] = useState("");
  const [dadosCadastro, setDadosCadastro] = useState(null);
  const [otpValidado, setOtpValidado] = useState(false);
  const [reenviandoOTP, setReenviandoOTP] = useState(false);
  const [tempoReenvio, setTempoReenvio]= useState(0);
  const [mensagemReenvio, setMensagemReenvio] = useState("");

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
    if (!produto) {
      alert("Selecione um produto antes de enviar o cadastro");
      return;
    }

    try {
      const response = await fetch("/api/cadastro", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...data,
          produto_id: produto.id,
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

      setDadosCadastro(data);
      setContatoId(resultado.contato.id);
      setEtapa("verificacao");
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
    }
  }

  async function verificarOTP() {
    setErroOTP("");

    if (!/^\d{6}$/.test(codigo)) {
      setErroOTP("Digite um código de 6 dígitos.");
      return;
    }

    try {
      setIsVerificando(true);

      const response = await fetch("/api/otp/validar", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          contato_id: contatoId,
          codigo: codigo,
        }),
      });

      const resultado = await response.json();

      if (!response.ok) {
        setErroOTP(resultado.mensagem || resultado.erro);
        return;
      }

      setOtpValidado(true);
      setErroOTP("");
    } catch (error) {
      console.error("Erro ao verificar OTP:", error);

      setErroOTP("Não foi possível verificar o código.");
    } finally {
      setIsVerificando(false);
    }
  }

  useEffect(() => {
    if (tempoReenvio <= 0){
      return ;
    }

    const intervalo = setInterval(() => {
      setTempoReenvio((tempoAtual) => tempoAtual  - 1)
    }, 1000);

    return () => clearInterval(intervalo);
  }, [tempoReenvio]);

  async function reenviarOTP() {
  if (!contatoId) {
    return;
  }

  if (tempoReenvio > 0) {
    return;
  }

  try {
    setReenviandoOTP(true);
    setMensagemReenvio("");
    setErroOTP("");

    const response = await fetch("/api/otp/reenviar", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        contato_id: contatoId,
      }),
    });

    const resultado = await response.json();

    if (!response.ok) {
      setMensagemReenvio(resultado.erro || "Não foi possível reenviar o código.");
      return;
    }

    setCodigo("");
    setMensagemReenvio("Novo código enviado para o seu e-mail.");
    setTempoReenvio(60);
  } catch (error) {
    console.error("Erro ao reenviar OTP:", error);

    setMensagemReenvio(
      "Não foi possível reenviar o código."
    );
  } finally {
    setReenviandoOTP(false);
  }
}

  function continuarParaWhatsApp() {
    if (!dadosCadastro || !produto) {
      return;
    }

    const mensagemWhatsApp = `Olá! Meu nome é ${dadosCadastro.nome}.
Tenho interesse no seguinte produto:

Produto: ${produto.nome}
Preço: R$ ${Number(produto.preco)
      .toFixed(2)
      .replace(".", ",")}${
      dadosCadastro.mensagem
        ? `\n\nObservação:\n${dadosCadastro.mensagem}`
        : ""
    }`;

    const urlWhatsApp = `https://wa.me/${whatsAppNumero}?text=${encodeURIComponent(
      mensagemWhatsApp
    )}`;

    window.open(urlWhatsApp, "_blank");
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-lg space-y-6"
    >
      {etapa === "cadastro" && (
        <>
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

          {/* Botão de cadastro */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Enviando..." : "Enviar"}
          </Button>
        </>
      )}

      {etapa === "verificacao" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">
              Verificação de e-mail
            </h2>

            <p className="text-sm text-muted-foreground">
              Enviamos um código de 6 dígitos para o seu e-mail.
            </p>

            <p className="text-sm text-muted-foreground">
              Digite o código recebido para continuar.
            </p>
          </div>

          {!otpValidado && (
            <div className="space-y-2">
              <Label htmlFor="codigo">
                Código de verificação
              </Label>

              <Input
                id="codigo"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Digite o código"
                value={codigo}
                onChange={(event) => {
                  const valor = event.target.value.replace(/\D/g, "");
                  setCodigo(valor);
                }}
              />

              {erroOTP && (
                <p className="text-sm text-red-500">
                  {erroOTP}
                </p>
              )}
            </div>
          )}

                    {!otpValidado ? (
            <>
              <Button
                type="button"
                onClick={verificarOTP}
                disabled={isVerificando}
                className="w-full"
              >
                {isVerificando
                  ? "Verificando..."
                  : "Verificar código"}
              </Button>

              <div className="space-y-2 text-center">
                <p className="text-sm text-muted-foreground">
                  Não recebeu o código?
                </p>

                <Button
                  type="button"
                  variant="outline"
                  onClick={reenviarOTP}
                  disabled={reenviandoOTP || tempoReenvio > 0}
                  className="w-full"
                >
                  {reenviandoOTP
                    ? "Enviando..."
                    : tempoReenvio > 0
                      ? `Aguarde ${tempoReenvio} segundos`
                      : "Reenviar código"}
                </Button>

                {mensagemReenvio && (
                  <p className="text-sm text-muted-foreground">
                    {mensagemReenvio}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-green-600">
                E-mail verificado com sucesso!
              </p>

              <Button
                type="button"
                onClick={continuarParaWhatsApp}
                className="w-full"
              >
                Continuar para o WhatsApp
              </Button>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
